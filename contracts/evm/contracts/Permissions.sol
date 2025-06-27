// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Permissions is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant CROSS_CHAIN_ROLE = keccak256("CROSS_CHAIN_ROLE");

    // Permission levels
    enum PermissionLevel {
        NONE,           // No permissions
        USER,           // Basic user permissions
        TRUSTED,        // Trusted user (higher limits)
        OPERATOR,       // Protocol operator
        ADMIN           // Full admin access
    }

    // User permission data
    struct UserPermissions {
        PermissionLevel level;
        bool isWhitelisted;
        bool isBlacklisted;
        uint256 maxDepositAmount;
        uint256 maxBorrowAmount;
        uint256 dailyLimit;
        uint256 dailyUsed;
        uint256 lastResetTimestamp;
        string[] allowedActions;
        mapping(string => bool) actionPermissions;
    }

    // Multi-signature configuration
    struct MultiSigConfig {
        address[] signers;
        uint256 threshold;
        bool isActive;
        mapping(address => bool) isSigner;
    }

    // Time-locked operations
    struct TimeLockOperation {
        address target;
        bytes data;
        uint256 executeAfter;
        bool executed;
        address proposer;
        string description;
    }

    // State variables
    mapping(address => UserPermissions) public userPermissions;
    mapping(address => bool) public globalWhitelist;
    mapping(address => bool) public globalBlacklist;

    // Multi-signature
    MultiSigConfig public multiSig;
    mapping(bytes32 => mapping(address => bool)) public multiSigApprovals;
    mapping(bytes32 => uint256) public approvalCounts;

    // Time locks
    mapping(bytes32 => TimeLockOperation) public timeLockOperations;
    uint256 public timeLockDelay = 24 hours;

    // Emergency controls
    bool public emergencyMode;
    address public emergencyGuardian;

    // Action-specific permissions
    mapping(string => bool) public actionRequiresWhitelist;
    mapping(string => PermissionLevel) public minimumPermissionLevel;
    mapping(string => uint256) public actionDailyLimits;

    // Events
    event UserPermissionUpdated(address indexed user, PermissionLevel level, bool whitelisted, bool blacklisted);
    event ActionPermissionSet(address indexed user, string action, bool allowed);
    event MultiSigConfigUpdated(address[] signers, uint256 threshold);
    event MultiSigOperationProposed(bytes32 indexed operationId, address proposer, string description);
    event MultiSigOperationApproved(bytes32 indexed operationId, address approver);
    event MultiSigOperationExecuted(bytes32 indexed operationId, address executor);
    event TimeLockOperationProposed(bytes32 indexed operationId, uint256 executeAfter, string description);
    event TimeLockOperationExecuted(bytes32 indexed operationId, address executor);
    event EmergencyModeToggled(bool enabled, address guardian);
    event DailyLimitUpdated(address indexed user, uint256 newLimit);
    event DailyUsageReset(address indexed user);

    // Errors
    error NotWhitelisted();
    error Blacklisted();
    error InsufficientPermissions();
    error ActionNotAllowed();
    error DailyLimitExceeded();
    error EmergencyModeActive();
    error TimeLockNotReady();
    error InvalidMultiSigConfig();
    error InsufficientApprovals();
    error OperationAlreadyExecuted();

    modifier onlyWhitelisted() {
        if (!isWhitelisted(msg.sender)) revert NotWhitelisted();
        _;
    }

    modifier notBlacklisted() {
        if (isBlacklisted(msg.sender)) revert Blacklisted();
        _;
    }

    modifier whenNotEmergency() {
        if (emergencyMode) revert EmergencyModeActive();
        _;
    }

    modifier onlyMinimumLevel(PermissionLevel minLevel) {
        if (getUserPermissionLevel(msg.sender) < minLevel) revert InsufficientPermissions();
        _;
    }

    constructor(address admin, address emergencyGuardian_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        emergencyGuardian = emergencyGuardian_;

        // Set up default action requirements
        _setActionRequirements();
    }

    /**
     * @dev Set user permissions
     * @param user The user address
     * @param level Permission level
     * @param whitelisted Whether user is whitelisted
     * @param blacklisted Whether user is blacklisted
     * @param maxDepositAmount Maximum deposit amount
     * @param maxBorrowAmount Maximum borrow amount
     * @param dailyLimit Daily transaction limit
     */
    function setUserPermissions(
        address user,
        PermissionLevel level,
        bool whitelisted,
        bool blacklisted,
        uint256 maxDepositAmount,
        uint256 maxBorrowAmount,
        uint256 dailyLimit
    ) external onlyRole(ADMIN_ROLE) {
        require(!blacklisted || !whitelisted, "Cannot be both whitelisted and blacklisted");

        UserPermissions storage perms = userPermissions[user];
        perms.level = level;
        perms.isWhitelisted = whitelisted;
        perms.isBlacklisted = blacklisted;
        perms.maxDepositAmount = maxDepositAmount;
        perms.maxBorrowAmount = maxBorrowAmount;
        perms.dailyLimit = dailyLimit;

        // Reset daily usage if limit changed
        if (perms.dailyLimit != dailyLimit) {
            perms.dailyUsed = 0;
            perms.lastResetTimestamp = block.timestamp;
        }

        emit UserPermissionUpdated(user, level, whitelisted, blacklisted);
    }

    /**
     * @dev Set action-specific permission for a user
     * @param user The user address
     * @param action The action identifier
     * @param allowed Whether the action is allowed
     */
    function setUserActionPermission(address user, string calldata action, bool allowed)
        external
        onlyRole(ADMIN_ROLE)
    {
        userPermissions[user].actionPermissions[action] = allowed;
        emit ActionPermissionSet(user, action, allowed);
    }

    /**
     * @dev Check if user is whitelisted
     * @param user The user address
     * @return whitelisted Whether user is whitelisted
     */
    function isWhitelisted(address user) public view returns (bool whitelisted) {
        return globalWhitelist[user] || userPermissions[user].isWhitelisted;
    }

    /**
     * @dev Check if user is blacklisted
     * @param user The user address
     * @return blacklisted Whether user is blacklisted
     */
    function isBlacklisted(address user) public view returns (bool blacklisted) {
        return globalBlacklist[user] || userPermissions[user].isBlacklisted;
    }

    /**
     * @dev Get user permission level
     * @param user The user address
     * @return level User's permission level
     */
    function getUserPermissionLevel(address user) public view returns (PermissionLevel level) {
        return userPermissions[user].level;
    }

    /**
     * @dev Check if user can perform an action
     * @param user The user address
     * @param action The action identifier
     * @return allowed Whether the action is allowed
     */
    function canPerformAction(address user, string calldata action) external view returns (bool allowed) {
        // Check blacklist
        if (isBlacklisted(user)) return false;

        // Check emergency mode
        if (emergencyMode && !hasRole(EMERGENCY_ROLE, user)) return false;

        // Check whitelist requirement
        if (actionRequiresWhitelist[action] && !isWhitelisted(user)) return false;

        // Check minimum permission level
        PermissionLevel userLevel = getUserPermissionLevel(user);
        if (userLevel < minimumPermissionLevel[action]) return false;

        // Check specific action permission
        if (!userPermissions[user].actionPermissions[action]) {
            // If not explicitly set, allow based on permission level
            return userLevel >= PermissionLevel.USER;
        }

        return true;
    }

    /**
     * @dev Check and update daily limit usage
     * @param user The user address
     * @param amount Transaction amount
     * @return allowed Whether the transaction is allowed
     */
    function checkAndUpdateDailyLimit(address user, uint256 amount)
        external
        onlyRole(OPERATOR_ROLE)
        returns (bool allowed)
    {
        UserPermissions storage perms = userPermissions[user];

        // Reset daily usage if a day has passed
        if (block.timestamp >= perms.lastResetTimestamp + 1 days) {
            perms.dailyUsed = 0;
            perms.lastResetTimestamp = block.timestamp;
            emit DailyUsageReset(user);
        }

        // Check if transaction would exceed daily limit
        if (perms.dailyUsed + amount > perms.dailyLimit) {
            return false;
        }

        // Update daily usage
        perms.dailyUsed += amount;
        return true;
    }

    /**
     * @dev Configure multi-signature settings
     * @param signers Array of signer addresses
     * @param threshold Number of signatures required
     */
    function configureMultiSig(address[] calldata signers, uint256 threshold)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(signers.length > 0 && threshold > 0 && threshold <= signers.length, "Invalid configuration");

        // Clear existing signers
        for (uint256 i = 0; i < multiSig.signers.length; i++) {
            multiSig.isSigner[multiSig.signers[i]] = false;
        }

        // Set new signers
        delete multiSig.signers;
        for (uint256 i = 0; i < signers.length; i++) {
            require(signers[i] != address(0), "Invalid signer address");
            multiSig.signers.push(signers[i]);
            multiSig.isSigner[signers[i]] = true;
        }

        multiSig.threshold = threshold;
        multiSig.isActive = true;

        emit MultiSigConfigUpdated(signers, threshold);
    }

    /**
     * @dev Propose a multi-signature operation
     * @param target Target contract address
     * @param data Function call data
     * @param description Operation description
     * @return operationId Unique operation identifier
     */
    function proposeMultiSigOperation(
        address target,
        bytes calldata data,
        string calldata description
    ) external returns (bytes32 operationId) {
        require(multiSig.isSigner[msg.sender], "Not a signer");

        operationId = keccak256(abi.encodePacked(target, data, block.timestamp, msg.sender));

        // Automatically approve with proposer's signature
        multiSigApprovals[operationId][msg.sender] = true;
        approvalCounts[operationId] = 1;

        emit MultiSigOperationProposed(operationId, msg.sender, description);
        emit MultiSigOperationApproved(operationId, msg.sender);

        return operationId;
    }

    /**
     * @dev Approve a multi-signature operation
     * @param operationId The operation identifier
     */
    function approveMultiSigOperation(bytes32 operationId) external {
        require(multiSig.isSigner[msg.sender], "Not a signer");
        require(!multiSigApprovals[operationId][msg.sender], "Already approved");

        multiSigApprovals[operationId][msg.sender] = true;
        approvalCounts[operationId]++;

        emit MultiSigOperationApproved(operationId, msg.sender);
    }

    /**
     * @dev Execute a multi-signature operation
     * @param operationId The operation identifier
     * @param target Target contract address
     * @param data Function call data
     */
    function executeMultiSigOperation(
        bytes32 operationId,
        address target,
        bytes calldata data
    ) external nonReentrant {
        require(approvalCounts[operationId] >= multiSig.threshold, "Insufficient approvals");
        require(!timeLockOperations[operationId].executed, "Already executed");

        // Mark as executed to prevent replay
        timeLockOperations[operationId].executed = true;

        // Execute the operation
        (bool success, ) = target.call(data);
        require(success, "Operation failed");

        emit MultiSigOperationExecuted(operationId, msg.sender);
    }

    /**
     * @dev Propose a time-locked operation
     * @param target Target contract address
     * @param data Function call data
     * @param description Operation description
     * @return operationId Unique operation identifier
     */
    function proposeTimeLockOperation(
        address target,
        bytes calldata data,
        string calldata description
    ) external onlyRole(ADMIN_ROLE) returns (bytes32 operationId) {
        operationId = keccak256(abi.encodePacked(target, data, block.timestamp, msg.sender));

        timeLockOperations[operationId] = TimeLockOperation({
            target: target,
            data: data,
            executeAfter: block.timestamp + timeLockDelay,
            executed: false,
            proposer: msg.sender,
            description: description
        });

        emit TimeLockOperationProposed(operationId, block.timestamp + timeLockDelay, description);

        return operationId;
    }

    /**
     * @dev Execute a time-locked operation
     * @param operationId The operation identifier
     */
    function executeTimeLockOperation(bytes32 operationId) external nonReentrant {
        TimeLockOperation storage operation = timeLockOperations[operationId];

        require(operation.target != address(0), "Operation not found");
        require(block.timestamp >= operation.executeAfter, "Time lock not expired");
        require(!operation.executed, "Already executed");

        operation.executed = true;

        (bool success, ) = operation.target.call(operation.data);
        require(success, "Operation failed");

        emit TimeLockOperationExecuted(operationId, msg.sender);
    }

    /**
     * @dev Toggle emergency mode
     * @param enabled Whether to enable emergency mode
     */
    function setEmergencyMode(bool enabled) external {
        require(
            msg.sender == emergencyGuardian || hasRole(EMERGENCY_ROLE, msg.sender),
            "Not authorized"
        );

        emergencyMode = enabled;
        emit EmergencyModeToggled(enabled, msg.sender);
    }

    /**
     * @dev Set action requirements
     * @param action The action identifier
     * @param requiresWhitelist Whether action requires whitelist
     * @param minLevel Minimum permission level required
     * @param dailyLimit Daily limit for this action
     */
    function setActionRequirements(
        string calldata action,
        bool requiresWhitelist,
        PermissionLevel minLevel,
        uint256 dailyLimit
    ) external onlyRole(ADMIN_ROLE) {
        actionRequiresWhitelist[action] = requiresWhitelist;
        minimumPermissionLevel[action] = minLevel;
        actionDailyLimits[action] = dailyLimit;
    }

    /**
     * @dev Set time lock delay
     * @param delay New delay in seconds
     */
    function setTimeLockDelay(uint256 delay) external onlyRole(ADMIN_ROLE) {
        require(delay >= 1 hours && delay <= 7 days, "Invalid delay");
        timeLockDelay = delay;
    }

    /**
     * @dev Emergency function to update guardian
     * @param newGuardian New emergency guardian address
     */
    function updateEmergencyGuardian(address newGuardian) external {
        require(msg.sender == emergencyGuardian, "Only current guardian");
        emergencyGuardian = newGuardian;
    }

    // Internal functions

    function _setActionRequirements() internal {
        // Set default requirements for common actions
        actionRequiresWhitelist["deposit"] = false;
        minimumPermissionLevel["deposit"] = PermissionLevel.USER;

        actionRequiresWhitelist["borrow"] = false;
        minimumPermissionLevel["borrow"] = PermissionLevel.USER;

        actionRequiresWhitelist["withdraw"] = false;
        minimumPermissionLevel["withdraw"] = PermissionLevel.USER;

        actionRequiresWhitelist["liquidate"] = true;
        minimumPermissionLevel["liquidate"] = PermissionLevel.TRUSTED;

        actionRequiresWhitelist["admin"] = true;
        minimumPermissionLevel["admin"] = PermissionLevel.ADMIN;
    }
}
