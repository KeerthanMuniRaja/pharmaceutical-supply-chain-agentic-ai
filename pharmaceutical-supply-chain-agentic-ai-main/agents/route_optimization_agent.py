"""
Route Optimization Agent for Pharmaceutical Supply Chain Agentic AI

This agent optimizes delivery routes using Google OR-Tools VRP solver.
"""

import logging
import math
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)

try:
    from ortools.constraint_solver import routing_enums_pb2
    from ortools.constraint_solver import pywrapcp
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False
    logger.warning("OR-Tools not available. Install with: pip install ortools")

# ── Real-world coordinates (lat, lon) for known Indian branch cities ──────────
LOCATION_COORDS: Dict[str, Tuple[float, float]] = {
    "MAIN_BRANCH":   (28.6139, 77.2090),   # New Delhi
    "NORTH_BRANCH":  (30.7333, 76.7794),   # Chandigarh
    "SOUTH_BRANCH":  (12.9716, 77.5946),   # Bangalore
    "EAST_BRANCH":   (22.5726, 88.3639),   # Kolkata
    "WEST_BRANCH":   (19.0760, 72.8777),   # Mumbai
}

# ── Logistics constants ────────────────────────────────────────────────────────
FUEL_LITERS_PER_KM   = 0.35   # Heavy pharma truck: ~2.86 km/L diesel
FUEL_COST_INR_PER_L  = 95.0   # Diesel price ≈ ₹95/L (2024 India)
AVG_SPEED_KMPH       = 50.0   # Realistic highway + city average
STOP_TIME_HOURS      = 0.5    # 30 min per delivery stop


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in km between two lat/lon points."""
    R = 6371.0  # Earth radius km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _get_coords(location_id: str) -> Tuple[float, float]:
    """Get coordinates for a branch, falling back to a hash-based pseudo location near India."""
    if location_id in LOCATION_COORDS:
        return LOCATION_COORDS[location_id]
    # Deterministic but varied fallback centred on India
    seed = sum(ord(c) for c in location_id)
    rng = np.random.RandomState(seed)
    lat = 20.0 + rng.uniform(-8.0, 8.0)
    lon = 78.0 + rng.uniform(-8.0, 8.0)
    return (lat, lon)


class RouteOptimizationAgent:
    """
    Agent for optimizing pharmaceutical delivery routes using VRP.

    Uses Google OR-Tools to solve Vehicle Routing Problem with:
    - Real Haversine distances between Indian branch locations
    - Capacity constraints
    - Time windows
    - Distance/cost/fuel optimization
    """

    def __init__(self):
        if not ORTOOLS_AVAILABLE:
            raise ImportError("OR-Tools is required for route optimization")

    def optimize_route(self, depot_id: str, destinations: List[str],
                       vehicle_capacity: int = 500, max_time_hours: int = 8,
                       objective: str = "min_distance") -> Dict[str, Any]:
        """
        Optimize delivery route for pharmaceutical distribution.

        Args:
            depot_id: Starting warehouse location
            destinations: List of delivery destinations
            vehicle_capacity: Vehicle capacity in units
            max_time_hours: Maximum route time in hours
            objective: Optimization objective

        Returns:
            Dictionary containing optimized route information with accurate
            distance, time, cost and fuel estimates.
        """
        try:
            logger.info(f"Optimizing route from {depot_id} to {len(destinations)} destinations")

            all_locations = [depot_id] + destinations
            distance_matrix = self._create_distance_matrix(all_locations)

            # Setup VRP solver
            manager = pywrapcp.RoutingIndexManager(len(distance_matrix), 1, 0)
            routing = pywrapcp.RoutingModel(manager)

            def distance_callback(from_index, to_index):
                from_node = manager.IndexToNode(from_index)
                to_node   = manager.IndexToNode(to_index)
                return distance_matrix[from_node][to_node]

            transit_callback_index = routing.RegisterTransitCallback(distance_callback)
            routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

            # Capacity constraint (50 units per stop)
            def demand_callback(from_index):
                return 50

            demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
            routing.AddDimensionWithVehicleCapacity(
                demand_callback_index, 0, [vehicle_capacity], True, "Capacity"
            )

            # Time constraint — distance_matrix in km, speed in km/h → minutes
            def time_callback(from_index, to_index):
                from_node = manager.IndexToNode(from_index)
                to_node   = manager.IndexToNode(to_index)
                travel_h  = distance_matrix[from_node][to_node] / AVG_SPEED_KMPH
                return int((travel_h + STOP_TIME_HOURS) * 60)

            time_callback_index = routing.RegisterTransitCallback(time_callback)
            routing.AddDimension(
                time_callback_index,
                0,
                int(max_time_hours * 60),
                True,
                "Time"
            )

            search_parameters = pywrapcp.DefaultRoutingSearchParameters()
            search_parameters.first_solution_strategy = (
                routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
            )
            search_parameters.time_limit.FromSeconds(10)

            solution = routing.SolveWithParameters(search_parameters)

            if solution:
                return self._extract_solution(
                    manager, routing, solution, depot_id, destinations, distance_matrix
                )
            else:
                logger.warning("No solution found — using fallback")
                return self._fallback_solution(depot_id, destinations, distance_matrix)

        except Exception as e:
            logger.error(f"Error in route optimization: {e}")
            return self._error_response(str(e))

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _create_distance_matrix(self, locations: List[str]) -> List[List[int]]:
        """Build a symmetric distance matrix (integer km) from Haversine distances."""
        n = len(locations)
        matrix: List[List[int]] = [[0] * n for _ in range(n)]
        coords = [_get_coords(loc) for loc in locations]

        for i in range(n):
            for j in range(n):
                if i != j:
                    km = _haversine_km(coords[i][0], coords[i][1],
                                       coords[j][0], coords[j][1])
                    matrix[i][j] = int(round(km))
        return matrix

    def _extract_solution(self, manager, routing, solution, depot_id: str,
                          destinations: List[str],
                          distance_matrix: List[List[int]]) -> Dict[str, Any]:
        """Extract solution metrics from OR-Tools output."""
        try:
            route: List[str] = []
            index = routing.Start(0)
            route_distance_km = 0

            while not routing.IsEnd(index):
                node = manager.IndexToNode(index)
                route.append(depot_id if node == 0 else destinations[node - 1])
                prev_index = index
                index = solution.Value(routing.NextVar(index))
                if not routing.IsEnd(index):
                    fn = manager.IndexToNode(prev_index)
                    tn = manager.IndexToNode(index)
                    route_distance_km += distance_matrix[fn][tn]

            # Return leg back to depot
            route.append(depot_id)
            last_node = manager.IndexToNode(prev_index)
            route_distance_km += distance_matrix[last_node][0]

            return self._build_result(route, route_distance_km, len(destinations), "OR-Tools VRP",
                                      distance_matrix)

        except Exception as e:
            logger.error(f"Error extracting solution: {e}")
            return self._fallback_solution(depot_id, destinations, distance_matrix)

    def _fallback_solution(self, depot_id: str, destinations: List[str],
                           distance_matrix: List[List[int]]) -> Dict[str, Any]:
        """Simple sequential route when VRP fails."""
        route = [depot_id] + destinations + [depot_id]
        total_km = sum(
            distance_matrix[i][i + 1] for i in range(len(distance_matrix) - 1)
            if i < len(distance_matrix)
        )
        if total_km == 0:
            # Shouldn't happen but guard against edge case
            total_km = sum(row[0] for row in distance_matrix[1:])
        return self._build_result(route, total_km, len(destinations), "Simple sequencing",
                                  distance_matrix, is_fallback=True)

    def _build_result(self, route: List[str], total_km: int, num_stops: int,
                      method: str, distance_matrix: List[List[int]],
                      is_fallback: bool = False) -> Dict[str, Any]:
        """Compute all derived metrics from the route distance."""
        # Time (hours)
        travel_time_h = total_km / AVG_SPEED_KMPH
        stop_time_h   = num_stops * STOP_TIME_HOURS
        total_time_h  = round(travel_time_h + stop_time_h, 2)

        # Fuel
        fuel_liters   = round(total_km * FUEL_LITERS_PER_KM, 1)
        fuel_cost_inr = round(fuel_liters * FUEL_COST_INR_PER_L, 0)

        # Savings vs naïve round-trip (sum of all pair distances / 2)
        all_dists = [d for row in distance_matrix for d in row if d > 0]
        naive_km = sum(all_dists) / max(len(all_dists), 1) * (len(distance_matrix) - 1)
        savings_pct = max(0.0, (naive_km - total_km) / max(naive_km, 1) * 100)

        return {
            "sequence":            route,
            "total_distance_km":   int(total_km),
            "total_time_hours":    total_time_h,
            "total_cost_usd":      round(fuel_cost_inr / 83.0, 2),   # INR→USD
            "fuel_liters":         fuel_liters,
            "fuel_cost_inr":       int(fuel_cost_inr),
            "savings_vs_baseline": f"{savings_pct:.1f}%",
            "vehicle_used":        1,
            "status":              "fallback" if is_fallback else "success",
            "optimization_method": method,
        }

    def _error_response(self, error_msg: str) -> Dict[str, Any]:
        return {
            "sequence":            [],
            "total_distance_km":   0,
            "total_time_hours":    0,
            "total_cost_usd":      0,
            "fuel_liters":         0,
            "fuel_cost_inr":       0,
            "savings_vs_baseline": "0%",
            "status":              "error",
            "message":             error_msg,
        }
