// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChainBlock {
    struct EventInfo {
        uint256 timestamp;
        string depotId;
        string destinations;
        int256 totalCostUsd;
        string savingsVsBaseline;
        address registeredBy;
    }

    // Mapping to store optimization logs uniquely based on an optimization ID or hash
    mapping(bytes32 => EventInfo) public optimizations;
    bytes32[] public optimizationIds;

    event RouteOptimized(
        bytes32 indexed optimizationId,
        string depotId,
        string destinations,
        uint256 timestamp
    );

    function recordOptimization(
        bytes32 _optimizationId,
        string memory _depotId,
        string memory _destinations,
        int256 _totalCostUsd,
        string memory _savingsVsBaseline
    ) public {
        // Ensure this ID hasn't been used yet
        require(optimizations[_optimizationId].timestamp == 0, "Optimization already recorded");

        EventInfo memory newEvent = EventInfo({
            timestamp: block.timestamp,
            depotId: _depotId,
            destinations: _destinations,
            totalCostUsd: _totalCostUsd,
            savingsVsBaseline: _savingsVsBaseline,
            registeredBy: msg.sender
        });

        optimizations[_optimizationId] = newEvent;
        optimizationIds.push(_optimizationId);

        emit RouteOptimized(_optimizationId, _depotId, _destinations, block.timestamp);
    }

    function getOptimizationDetails(bytes32 _optimizationId) public view returns (
        uint256 timestamp,
        string memory depotId,
        string memory destinations,
        int256 totalCostUsd,
        string memory savingsVsBaseline,
        address registeredBy
    ) {
        EventInfo memory e = optimizations[_optimizationId];
        return (e.timestamp, e.depotId, e.destinations, e.totalCostUsd, e.savingsVsBaseline, e.registeredBy);
    }
    
    function getTotalOptimizations() public view returns (uint256) {
        return optimizationIds.length;
    }
}
