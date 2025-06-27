// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title TimeLock
 * @dev Time-locked governance for critical protocol operations
 * Provides additional security layer for admin functions
 */
contract TimeLock is TimelockController {
    // Minimum delay for different operations (in seconds)
    uint256 public constant MIN_DELAY = 24 hours; // 1 day
    uint256 public constant CRITICAL_DELAY = 72 hours; // 3 days
    uint256 public constant EMERGENCY_DELAY = 1 hours; // 1 hour for emergencies

    // Additional role identifiers
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Operation categories
    enum OperationType {
        STANDARD,      // 24h delay
        CRITICAL,      // 72h delay
        EMERGENCY      // 1h delay
    }

    // Track operation types
    mapping(bytes32 => OperationType) public operationTypes;
    mapping(bytes32 => uint256) public customDelays;

    // Events
    event OperationTypeSet(bytes32 indexed operationId, OperationType operationType);
    event CustomDelaySet(bytes32 indexed operationId, uint256 delay);
    event EmergencyOperationExecuted(bytes32 indexed operationId, address indexed executor);

    constructor(
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(MIN_DELAY, proposers, executors, admin) {
        // Grant emergency role to admin
        _grantRole(EMERGENCY_ROLE, admin);
    }

    /**
     * @dev Set operation type for a specific function signature
     */
    function setOperationType(
        address target,
        bytes4 selector,
        OperationType operationType
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bytes32 operationId = keccak256(abi.encodePacked(target, selector));
        operationTypes[operationId] = operationType;

        emit OperationTypeSet(operationId, operationType);
    }

    /**
     * @dev Set custom delay for specific operation
     */
    function setCustomDelay(
        address target,
        bytes4 selector,
        uint256 delay
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(delay >= 1 hours, "Delay too short");
        require(delay <= 30 days, "Delay too long");

        bytes32 operationId = keccak256(abi.encodePacked(target, selector));
        customDelays[operationId] = delay;

        emit CustomDelaySet(operationId, delay);
    }

    /**
     * @dev Schedule operation with appropriate delay based on type
     */
    function scheduleWithType(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyRole(PROPOSER_ROLE) {
        bytes4 selector = bytes4(data[:4]);
        bytes32 operationId = keccak256(abi.encodePacked(target, selector));

        uint256 delay = _getOperationDelay(operationId);

        schedule(target, value, data, predecessor, salt, delay);
    }

    /**
     * @dev Emergency execution with reduced delay
     */
    function emergencyExecute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyRole(EMERGENCY_ROLE) {
        bytes32 id = hashOperation(target, value, data, predecessor, salt);

        // Check if operation was scheduled with emergency delay
        require(getTimestamp(id) != 0, "Operation not scheduled");
        require(
            block.timestamp >= getTimestamp(id),
            "Emergency delay not met"
        );

        execute(target, value, data, predecessor, salt);

        emit EmergencyOperationExecuted(id, msg.sender);
    }

    /**
     * @dev Get appropriate delay for operation
     */
    function _getOperationDelay(bytes32 operationId) internal view returns (uint256) {
        // Check for custom delay first
        if (customDelays[operationId] > 0) {
            return customDelays[operationId];
        }

        // Use operation type delay
        OperationType opType = operationTypes[operationId];

        if (opType == OperationType.CRITICAL) {
            return CRITICAL_DELAY;
        } else if (opType == OperationType.EMERGENCY) {
            return EMERGENCY_DELAY;
        } else {
            return MIN_DELAY;
        }
    }

    /**
     * @dev Get operation delay for external view
     */
    function getOperationDelay(address target, bytes4 selector)
        external
        view
        returns (uint256)
    {
        bytes32 operationId = keccak256(abi.encodePacked(target, selector));
        return _getOperationDelay(operationId);
    }
}
