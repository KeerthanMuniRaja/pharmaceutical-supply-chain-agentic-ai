'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MapPin, Truck, Route, Clock, DollarSign, Navigation, Activity, Plus, X, Map, Satellite, Mountain, Moon, Fuel } from 'lucide-react'
import type { MapStyle } from '@/components/RouteMap'

// ── Dynamically load the map (avoid SSR) ─────────────────────────────────────
interface RouteMapProps {
  markers?: Array<{ id: string; position: [number, number]; label: string; type: 'depot' | 'destination' }>
  routePolyline?: [number, number][]
  center?: [number, number]
  zoom?: number
  mapStyle?: MapStyle
}

const RouteMap = dynamic<RouteMapProps>(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[350px] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-center space-y-2">
        <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-500">Loading map...</p>
      </div>
    </div>
  )
})

interface RoutePlan {
  sequence: string[]
  total_distance_km: number
  total_time_hours: number
  total_cost_usd: number
  fuel_liters?: number
  fuel_cost_inr?: number
  savings_vs_baseline: string
  vehicle_used: number
  status: string
}

// ── Real Indian city coordinates ──────────────────────────────────────────────
const BRANCH_COORDS: Record<string, [number, number]> = {
  'MAIN_BRANCH':  [28.6139, 77.2090],  // New Delhi
  'NORTH_BRANCH': [30.7333, 76.7794],  // Chandigarh
  'SOUTH_BRANCH': [12.9716, 77.5946],  // Bangalore
  'EAST_BRANCH':  [22.5726, 88.3639],  // Kolkata
  'WEST_BRANCH':  [19.0760, 72.8777],  // Mumbai
}

const MAP_STYLE_OPTIONS: { value: MapStyle; label: string; icon: React.ReactNode }[] = [
  { value: 'street',    label: 'Street',    icon: <Map className="h-3.5 w-3.5" /> },
  { value: 'satellite', label: 'Satellite', icon: <Satellite className="h-3.5 w-3.5" /> },
  { value: 'terrain',   label: 'Terrain',   icon: <Mountain className="h-3.5 w-3.5" /> },
  { value: 'dark',      label: 'Dark',      icon: <Moon className="h-3.5 w-3.5" /> },
]

export default function RoutesPage() {
  const [depotId, setDepotId]             = useState('')
  const [destinations, setDestinations]   = useState<string[]>([])
  const [newDestination, setNewDestination] = useState('')
  const [vehicleCapacity, setVehicleCapacity] = useState(500)
  const [maxTimeHours, setMaxTimeHours]   = useState(8)
  const [routePlan, setRoutePlan]         = useState<RoutePlan | null>(null)
  const [isLoading, setIsLoading]         = useState(false)
  const [customDepot, setCustomDepot]     = useState('')
  const [mapStyle, setMapStyle]           = useState<MapStyle>('street')

  const addDestination = () => {
    const dest = newDestination.trim().toUpperCase().replace(/\s+/g, '_')
    if (dest && !destinations.includes(dest)) {
      setDestinations([...destinations, dest])
      setNewDestination('')
      if (!BRANCH_COORDS[dest]) {
        const seed = dest.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
        BRANCH_COORDS[dest] = [
          20.0 + ((seed * 7) % 16) - 8,
          78.0 + ((seed * 13) % 16) - 8,
        ]
      }
    }
  }

  const handleSetCustomDepot = () => {
    const dep = customDepot.trim().toUpperCase().replace(/\s+/g, '_')
    if (dep) {
      setDepotId(dep)
      if (!BRANCH_COORDS[dep]) {
        const seed = dep.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
        BRANCH_COORDS[dep] = [
          20.0 + ((seed * 7) % 16) - 8,
          78.0 + ((seed * 13) % 16) - 8,
        ]
      }
      setCustomDepot('')
    }
  }

  const removeDestination = (dest: string) => {
    setDestinations(destinations.filter(d => d !== dest))
  }

  const optimizeRoute = async () => {
    if (!depotId || destinations.length === 0) {
      alert('Please select a depot and at least one destination')
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/routes/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depot_id: depotId,
          destinations,
          vehicle_capacity: vehicleCapacity,
          max_time_hours: maxTimeHours,
          objective: 'min_distance'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRoutePlan(data)
      } else {
        // Realistic client-side fallback using Haversine
        setRoutePlan(buildClientFallback(depotId, destinations))
      }
    } catch {
      setRoutePlan(buildClientFallback(depotId, destinations))
    } finally {
      setIsLoading(false)
    }
  }

  const branches = ['MAIN_BRANCH', 'NORTH_BRANCH', 'SOUTH_BRANCH', 'EAST_BRANCH', 'WEST_BRANCH']

  const mapMarkers = routePlan
    ? routePlan.sequence
        .filter((step, idx, arr) => idx === 0 || arr.indexOf(step) === idx)
        .map((step, idx) => ({
          id:       step,
          position: BRANCH_COORDS[step] ?? [28.6139, 77.2090] as [number, number],
          label:    step.replace(/_/g, ' '),
          type:    (idx === 0 ? 'depot' : 'destination') as 'depot' | 'destination',
        }))
    : [
        ...(depotId ? [{ id: depotId, position: BRANCH_COORDS[depotId] ?? [28.6139, 77.2090] as [number, number], label: depotId.replace(/_/g, ' '), type: 'depot' as const }] : []),
        ...destinations.map(d => ({ id: d, position: BRANCH_COORDS[d] ?? [28.6139, 77.2090] as [number, number], label: d.replace(/_/g, ' '), type: 'destination' as const })),
      ]

  const routePolyline: [number, number][] = routePlan
    ? routePlan.sequence.map(step => BRANCH_COORDS[step] ?? [28.6139, 77.2090])
    : []

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-8 bg-gray-950 min-h-screen text-gray-100 p-6 rounded-2xl relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 tracking-tight">
            Logistics &amp; Route Optimization
          </h1>
          <p className="text-gray-400 text-sm mt-1">Plan and deploy highly efficient clinical delivery routes autonomously.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left panel: Route Parameters ── */}
        <div className="lg:col-span-2 relative z-10">
          <Card className="border border-gray-800 shadow-2xl bg-gray-900/60 backdrop-blur-xl rounded-2xl">
            <CardHeader className="p-5 border-b border-gray-800/50 pb-4">
              <CardTitle className="text-lg font-bold text-white flex items-center">
                <Route className="h-5 w-5 mr-2 text-emerald-400" />
                Route Parameters
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-1">
                Configure critical parameters for supply chain transit.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Depot selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Primary Depot (Start)</label>
                <div className="flex space-x-2">
                  <Select value={depotId} onValueChange={setDepotId}>
                    <SelectTrigger className="w-1/2 bg-gray-700/70 border-gray-600 text-gray-100 focus:ring-emerald-500/50">
                      <SelectValue placeholder="Select preset..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                      {branches.map(branch => (
                        <SelectItem key={branch} value={branch} className="hover:bg-gray-600 focus:bg-gray-600 text-gray-100">
                          {branch.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Custom depot..."
                    value={customDepot}
                    onChange={e => setCustomDepot(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSetCustomDepot()}
                    className="flex-1 bg-gray-700/70 border-gray-600 text-white placeholder-gray-400 focus:ring-emerald-500/50"
                  />
                  <Button onClick={handleSetCustomDepot} variant="outline" size="icon" className="flex-shrink-0 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
                {depotId && <p className="text-xs text-emerald-400 mt-1">Active Depot: {depotId.replace(/_/g, ' ')}</p>}
              </div>

              {/* Destinations */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Target Destinations</label>
                <div className="flex space-x-2 mb-3">
                  <Select value={newDestination} onValueChange={setNewDestination}>
                    <SelectTrigger className="w-1/2 bg-gray-700/70 border-gray-600 text-gray-100 focus:ring-emerald-500/50">
                      <SelectValue placeholder="Select destination..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                      {branches.filter(b => b !== depotId && !destinations.includes(b)).map(branch => (
                        <SelectItem key={branch} value={branch} className="hover:bg-gray-600 focus:bg-gray-600 text-gray-100">
                          {branch.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Custom destination..."
                    value={newDestination.startsWith('DUMMY') ? '' : (!branches.includes(newDestination) ? newDestination : '')}
                    onChange={e => setNewDestination(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addDestination()}
                    className="flex-1 bg-gray-700/70 border-gray-600 text-white placeholder-gray-400 focus:ring-emerald-500/50"
                  />
                  <Button onClick={addDestination} variant="outline" size="icon" className="flex-shrink-0 border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-lg bg-gray-800/30 border border-gray-800/50">
                  {destinations.length === 0 && <span className="text-xs text-gray-500 italic py-1">No destinations added.</span>}
                  {destinations.map(dest => (
                    <Badge key={dest} variant="outline"
                      className="cursor-pointer bg-blue-500/10 text-blue-300 border-blue-500/30 px-2.5 py-1 text-xs flex items-center gap-1 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-colors"
                      onClick={() => removeDestination(dest)}>
                      {dest.replace(/_/g, ' ')} <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Capacity / Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Capacity (kg)</label>
                  <Input type="number" value={isNaN(vehicleCapacity) ? '' : vehicleCapacity} onChange={e => setVehicleCapacity(parseInt(e.target.value) || 0)} className="bg-gray-700/70 border-gray-600 text-white focus:ring-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Max Hours</label>
                  <Input type="number" value={isNaN(maxTimeHours) ? '' : maxTimeHours} onChange={e => setMaxTimeHours(parseInt(e.target.value) || 0)} className="bg-gray-700/70 border-gray-600 text-white focus:ring-emerald-500/50" />
                </div>
              </div>

              <Button
                onClick={optimizeRoute}
                disabled={isLoading || !depotId || destinations.length === 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all border-none disabled:opacity-50"
              >
                {isLoading
                  ? <><Activity className="h-5 w-5 mr-2 animate-spin" />Optimizing Route...</>
                  : <><Navigation className="h-5 w-5 mr-2" />Generate Optimal Route</>}
              </Button>
            </CardContent>
          </Card>

          {/* Stats row */}
          {routePlan && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* Distance */}
              <StatCard
                icon={<Route className="h-4 w-4 text-emerald-400" />}
                label="Distance"
                value={`${routePlan.total_distance_km.toLocaleString()} km`}
                gradient="from-emerald-500/10"
              />
              {/* Duration */}
              <StatCard
                icon={<Clock className="h-4 w-4 text-blue-400" />}
                label="Duration"
                value={`${routePlan.total_time_hours.toFixed(1)} hrs`}
                gradient="from-blue-500/10"
              />
              {/* Fuel */}
              <StatCard
                icon={<Fuel className="h-4 w-4 text-orange-400" />}
                label="Est. Fuel"
                value={routePlan.fuel_liters ? `${routePlan.fuel_liters} L` : `${(routePlan.total_distance_km * 0.35).toFixed(1)} L`}
                sub={routePlan.fuel_cost_inr ? `≈ ₹${routePlan.fuel_cost_inr.toLocaleString()}` : undefined}
                gradient="from-orange-500/10"
              />
              {/* Efficiency */}
              <StatCard
                icon={<Truck className="h-4 w-4 text-emerald-300" />}
                label="Efficiency"
                value={routePlan.savings_vs_baseline}
                highlight
              />
            </div>
          )}
        </div>

        {/* ── Right panel: Map ── */}
        <div className="lg:col-span-3 relative z-10">
          <Card className="border border-gray-800 shadow-2xl bg-gray-900/60 backdrop-blur-xl rounded-2xl h-full flex flex-col overflow-hidden">
            <CardHeader className="p-5 border-b border-gray-800/50 pb-4 bg-gray-900/80">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-400" />
                  <CardTitle className="text-base font-bold text-white">Live Route Map</CardTitle>
                  {routePlan && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 border text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Route Active
                    </Badge>
                  )}
                </div>
                {/* Map Style Switcher */}
                <div className="flex gap-1 bg-gray-800/60 rounded-lg p-1">
                  {MAP_STYLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setMapStyle(opt.value)}
                      title={opt.label}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        mapStyle === opt.value
                          ? 'bg-emerald-500 text-white shadow'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {opt.icon}
                      <span className="hidden sm:inline">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <CardDescription className="text-xs text-gray-400 mt-1">
                Interactive map — switch styles above. Markers show actual city coordinates.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 flex-1 min-h-[500px] relative">
              <div className="absolute inset-0 h-full w-full">
                <RouteMap
                  markers={mapMarkers}
                  routePolyline={routePolyline}
                  center={[22.0, 78.5]}
                  zoom={5}
                  mapStyle={mapStyle}
                />
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}

// ── Small helper component ────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, gradient = 'from-gray-500/10', highlight = false }: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  gradient?: string
  highlight?: boolean
}) {
  return (
    <Card className={`border ${highlight ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-gray-800 bg-gray-900/60'} shadow-xl backdrop-blur-md rounded-xl overflow-hidden relative group`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <CardContent className="p-5 flex flex-col justify-center space-y-1.5">
        <div className="flex items-center space-x-2">
          {icon}
          <p className={`text-xs font-bold uppercase tracking-wider ${highlight ? 'text-emerald-400' : 'text-gray-400'}`}>{label}</p>
        </div>
        <p className="text-2xl font-extrabold text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Client-side realist fallback (used if backend is offline) ─────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function buildClientFallback(depotId: string, destinations: string[]): RoutePlan {
  const stops = [depotId, ...destinations, depotId]
  let totalKm = 0
  for (let i = 0; i < stops.length - 1; i++) {
    const a = BRANCH_COORDS[stops[i]]   ?? [28.6139, 77.2090]
    const b = BRANCH_COORDS[stops[i+1]] ?? [28.6139, 77.2090]
    totalKm += haversineKm(a[0], a[1], b[0], b[1])
  }
  totalKm = Math.round(totalKm)
  const fuelLiters    = Math.round(totalKm * 0.35 * 10) / 10
  const fuelCostInr   = Math.round(fuelLiters * 95)
  const totalTimeHrs  = Math.round((totalKm / 50 + destinations.length * 0.5) * 10) / 10
  return {
    sequence:            stops,
    total_distance_km:   totalKm,
    total_time_hours:    totalTimeHrs,
    total_cost_usd:      Math.round(fuelCostInr / 83),
    fuel_liters:         fuelLiters,
    fuel_cost_inr:       fuelCostInr,
    savings_vs_baseline: '—',
    vehicle_used:        1,
    status:              'client_fallback',
  }
}