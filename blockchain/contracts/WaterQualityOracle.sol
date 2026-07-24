// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WaterQualityOracle
 * @notice Immutable on-chain registry for MajiSmart sensor readings.
 *
 *   Every sensor reading submitted by the MajiSmart backend is stored here.
 *   Data cannot be altered once submitted — giving citizens, NGOs, and regulators
 *   a tamper-proof history of water quality across every node.
 *
 *   WHO thresholds (stored * 100 for integer arithmetic):
 *     Turbidity ≤ 400  (= 4.0 NTU)   → SAFE
 *     Turbidity > 400  and ≤ 1000     → BOIL_FIRST
 *     Turbidity > 1000                → UNSAFE
 */
contract WaterQualityOracle {

    // ── Safety enum ───────────────────────────────────────────────────────
    enum SafetyStatus { SAFE, BOIL_FIRST, UNSAFE, UNKNOWN }

    // ── Structs ───────────────────────────────────────────────────────────
    struct Reading {
        uint32  turbidity;      // NTU * 100
        uint32  flowRate;       // L/min * 100
        uint16  temperature;    // °C * 10
        uint8   ph;             // pH * 10
        uint8   safetyScore;    // 0–100
        SafetyStatus safety;
        uint256 timestamp;
        address submittedBy;
    }

    struct OnChainAlert {
        string  nodeId;
        string  alertType;      // "high_turbidity" | "low_flow" | "temp_anomaly"
        string  message;
        uint8   severity;       // 1=info 2=warning 3=critical
        uint256 timestamp;
        bool    resolved;
        address resolvedBy;
        uint256 resolvedAt;
    }

    // ── State ─────────────────────────────────────────────────────────────
    address public owner;

    mapping(address => bool) public authorizedSubmitters; // backend wallets
    mapping(string  => bool) public registeredNodes;

    // nodeId → ordered list of readings (append-only)
    mapping(string => Reading[])  public readings;
    // nodeId → latest reading (for fast lookup)
    mapping(string => Reading)    public latestReading;
    // nodeId → total reading count
    mapping(string => uint256)    public readingCount;

    OnChainAlert[] public alerts;

    // ── Events ────────────────────────────────────────────────────────────
    event ReadingSubmitted(
        string  indexed nodeId,
        uint32  turbidity,
        SafetyStatus safety,
        uint256 timestamp,
        address submitter
    );
    event AlertRaised(
        uint256 indexed alertId,
        string  nodeId,
        string  alertType,
        uint8   severity,
        uint256 timestamp
    );
    event AlertResolved(uint256 indexed alertId, address resolvedBy, uint256 resolvedAt);
    event NodeRegistered(string nodeId, bool status);
    event SubmitterAuthorized(address submitter, bool status);

    // ── Modifiers ─────────────────────────────────────────────────────────
    modifier onlyOwner()     { require(msg.sender == owner,                   "ORA: not owner");      _; }
    modifier onlySubmitter() { require(authorizedSubmitters[msg.sender],       "ORA: not authorised"); _; }

    constructor() { owner = msg.sender; }

    // ── Node registration ─────────────────────────────────────────────────
    function registerNode(string calldata nodeId, bool status) external onlyOwner {
        registeredNodes[nodeId] = status;
        emit NodeRegistered(nodeId, status);
    }

    function authorizeSubmitter(address submitter, bool status) external onlyOwner {
        authorizedSubmitters[submitter] = status;
        emit SubmitterAuthorized(submitter, status);
    }

    // ── Core: submit reading ──────────────────────────────────────────────
    function submitReading(
        string calldata nodeId,
        uint32  turbidity,
        uint32  flowRate,
        uint16  temperature,
        uint8   ph,
        uint8   safetyScore
    ) external onlySubmitter returns (uint256 readingId) {
        require(registeredNodes[nodeId], "ORA: node not registered");

        SafetyStatus safety;
        if      (turbidity <= 400)  safety = SafetyStatus.SAFE;
        else if (turbidity <= 1000) safety = SafetyStatus.BOIL_FIRST;
        else                        safety = SafetyStatus.UNSAFE;

        Reading memory r = Reading({
            turbidity:   turbidity,
            flowRate:    flowRate,
            temperature: temperature,
            ph:          ph,
            safetyScore: safetyScore,
            safety:      safety,
            timestamp:   block.timestamp,
            submittedBy: msg.sender
        });

        readings[nodeId].push(r);
        latestReading[nodeId] = r;
        readingId = readingCount[nodeId];
        readingCount[nodeId]++;

        emit ReadingSubmitted(nodeId, turbidity, safety, block.timestamp, msg.sender);

        // Auto-raise alert for unsafe water or zero flow
        if (safety != SafetyStatus.SAFE) {
            _raiseAlert(
                nodeId,
                safety == SafetyStatus.UNSAFE ? "high_turbidity" : "quality_warning",
                safety == SafetyStatus.UNSAFE
                    ? "Water turbidity critically exceeds WHO limit. Do not drink."
                    : "Water quality elevated. Boil before drinking.",
                safety == SafetyStatus.UNSAFE ? 3 : 2
            );
        }
        if (flowRate == 0) {
            _raiseAlert(nodeId, "zero_flow", "Flow rate is zero — pump failure or blockage suspected.", 3);
        }

        return readingId;
    }

    function _raiseAlert(
        string memory nodeId,
        string memory alertType,
        string memory message,
        uint8 severity
    ) internal {
        uint256 alertId = alerts.length;
        alerts.push(OnChainAlert({
            nodeId:    nodeId,
            alertType: alertType,
            message:   message,
            severity:  severity,
            timestamp: block.timestamp,
            resolved:  false,
            resolvedBy: address(0),
            resolvedAt: 0
        }));
        emit AlertRaised(alertId, nodeId, alertType, severity, block.timestamp);
    }

    // ── Alert resolution ──────────────────────────────────────────────────
    function resolveAlert(uint256 alertId) external onlySubmitter {
        require(alertId < alerts.length,   "ORA: invalid alertId");
        require(!alerts[alertId].resolved, "ORA: already resolved");
        alerts[alertId].resolved   = true;
        alerts[alertId].resolvedBy = msg.sender;
        alerts[alertId].resolvedAt = block.timestamp;
        emit AlertResolved(alertId, msg.sender, block.timestamp);
    }

    // ── Views ─────────────────────────────────────────────────────────────
    function getLatestReading(string calldata nodeId) external view returns (Reading memory) {
        return latestReading[nodeId];
    }

    function getReading(string calldata nodeId, uint256 index) external view returns (Reading memory) {
        require(index < readings[nodeId].length, "ORA: index out of bounds");
        return readings[nodeId][index];
    }

    function getSafetyLabel(string calldata nodeId) external view returns (string memory) {
        SafetyStatus s = latestReading[nodeId].safety;
        if (s == SafetyStatus.SAFE)       return "Safe to drink";
        if (s == SafetyStatus.BOIL_FIRST) return "Boil before drinking";
        if (s == SafetyStatus.UNSAFE)     return "Do not drink";
        return "No data";
    }

    function getAlert(uint256 alertId) external view returns (OnChainAlert memory) {
        require(alertId < alerts.length, "ORA: invalid alertId");
        return alerts[alertId];
    }

    function alertsCount()             external view returns (uint256) { return alerts.length; }
    function getReadingCount(string calldata nodeId) external view returns (uint256) { return readingCount[nodeId]; }

    // ── Ownership ─────────────────────────────────────────────────────────
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ORA: zero address");
        owner = newOwner;
    }
}
