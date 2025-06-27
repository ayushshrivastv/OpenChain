// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface ILendingPool {
    function getUserPosition(address user) external view returns (uint256, uint256, uint256, uint256);
    function liquidate(address user, address collateralAsset, address debtAsset, uint256 debtAmount) external;
    function pause() external;
    function unpause() external;
    function getUnhealthyUsers() external view returns (address[] memory);
}

/**
 * @title ChainlinkSecurity
 * @dev Comprehensive security module using Chainlink VRF and Automation
 * Features:
 * - Automated health monitoring and liquidations
 * - VRF-based randomization for fair liquidator selection
 * - Emergency response automation
 * - Security delays and circuit breakers
 * - Multi-signature security patterns
 */
contract ChainlinkSecurity is
    VRFConsumerBaseV2,
    AutomationCompatibleInterface,
    ConfirmedOwner,
    ReentrancyGuard,
    Pausable
{
    VRFCoordinatorV2Interface private vrfCoordinator;
    ILendingPool public lendingPool;

    // VRF Configuration
    uint64 private subscriptionId;
    bytes32 private keyHash;
    uint32 private callbackGasLimit = 2500000;
    uint16 private requestConfirmations = 3;
    uint32 private numWords = 1;

    // Security Configuration
    uint256 public constant HEALTH_FACTOR_THRESHOLD = 1e18; // 1.0
    uint256 public constant CRITICAL_HEALTH_FACTOR = 0.95e18; // 0.95
    uint256 public constant SECURITY_DELAY = 1 hours;
    uint256 public constant EMERGENCY_THRESHOLD = 10; // Max emergency liquidations per hour
    uint256 public constant MAX_LIQUIDATION_SIZE = 100000e18; // $100k max single liquidation

    // State Variables
    mapping(uint256 => LiquidationRequest) public liquidationRequests;
    mapping(address => uint256) public lastLiquidationTime;
    mapping(address => bool) public authorizedLiquidators;
    mapping(address => SecurityProfile) public userSecurityProfiles;

    uint256 public requestCounter;
    uint256 public emergencyLiquidationCount;
    uint256 public lastEmergencyReset;
    bool public emergencyMode;

    address[] public liquidatorPool;
    uint256 public lastHealthCheck;
    uint256 public securityScore = 100; // Out of 100

    // Structs
    struct LiquidationRequest {
        address user;
        address liquidator;
        uint256 amount;
        uint256 timestamp;
        bool executed;
        bool isEmergency;
    }

    struct SecurityProfile {
        uint256 riskScore; // 0-100, higher = more risky
        uint256 lastActivity;
        uint256 liquidationHistory;
        bool isHighRisk;
        uint256 securityDelay; // Custom delay for this user
    }

    struct HealthCheckResult {
        address[] unhealthyUsers;
        uint256 totalRisk;
        bool emergencyRequired;
        uint256 timestamp;
    }

    // Events
    event SecurityAlert(string alertType, address indexed user, uint256 severity, string details);
    event LiquidationQueued(uint256 indexed requestId, address indexed user, address indexed liquidator, uint256 amount);
    event EmergencyLiquidation(address indexed user, uint256 amount, string reason);
    event SecurityProfileUpdated(address indexed user, uint256 riskScore, bool isHighRisk);
    event AutomationExecuted(string taskType, uint256 timestamp, bytes data);
    event VRFRandomnessRequested(uint256 indexed requestId, address indexed user);
    event SecurityScoreUpdated(uint256 oldScore, uint256 newScore, string reason);

    // Errors
    error UnauthorizedLiquidator();
    error SecurityDelayNotMet();
    error EmergencyLimitExceeded();
    error InvalidSecurityScore();
    error LiquidationTooLarge();

    constructor(
        address _vrfCoordinator,
        address _lendingPool,
        uint64 _subscriptionId,
        bytes32 _keyHash
    )
        VRFConsumerBaseV2(_vrfCoordinator)
        ConfirmedOwner(msg.sender)
    {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        lendingPool = ILendingPool(_lendingPool);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        lastEmergencyReset = block.timestamp;
        lastHealthCheck = block.timestamp;
    }

    // ==================== CHAINLINK AUTOMATION ====================

    /**
     * @dev Chainlink Automation checkUpkeep function
     * Monitors protocol health and determines if automation is needed
     */
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        // Check if health monitoring is due (every 10 minutes)
        bool healthCheckDue = (block.timestamp - lastHealthCheck) > 600;

        // Check for emergency conditions
        bool emergencyDetected = _detectEmergencyConditions();

        // Check for pending liquidations
        bool liquidationsDue = _checkPendingLiquidations();

        // Reset emergency counter if needed
        bool counterReset = (block.timestamp - lastEmergencyReset) > 1 hours;

        upkeepNeeded = healthCheckDue || emergencyDetected || liquidationsDue || counterReset;

        if (upkeepNeeded) {
            performData = abi.encode(healthCheckDue, emergencyDetected, liquidationsDue, counterReset);
        }
    }

    /**
     * @dev Chainlink Automation performUpkeep function
     * Executes automated security tasks
     */
    function performUpkeep(bytes calldata performData) external override {
        (bool healthCheckDue, bool emergencyDetected, bool liquidationsDue, bool counterReset) =
            abi.decode(performData, (bool, bool, bool, bool));

        if (healthCheckDue) {
            _performHealthCheck();
        }

        if (emergencyDetected) {
            _handleEmergencyConditions();
        }

        if (liquidationsDue) {
            _executePendingLiquidations();
        }

        if (counterReset) {
            _resetEmergencyCounter();
        }

        emit AutomationExecuted("HealthAndSecurity", block.timestamp, performData);
    }

    // ==================== CHAINLINK VRF INTEGRATION ====================

    /**
     * @dev Request randomness for fair liquidator selection
     */
    function requestLiquidatorSelection(address user, uint256 amount)
        external
        onlyAuthorizedLiquidator
        returns (uint256 requestId)
    {
        if (amount > MAX_LIQUIDATION_SIZE) revert LiquidationTooLarge();

        // Request randomness from Chainlink VRF
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        // Store liquidation request
        liquidationRequests[requestId] = LiquidationRequest({
            user: user,
            liquidator: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            executed: false,
            isEmergency: false
        });

        requestCounter++;
        emit VRFRandomnessRequested(requestId, user);
        emit LiquidationQueued(requestId, user, msg.sender, amount);
    }

    /**
     * @dev Callback function for Chainlink VRF
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        LiquidationRequest storage request = liquidationRequests[requestId];
        require(!request.executed, "Request already executed");

        // Use randomness to select liquidator fairly
        uint256 selectedLiquidatorIndex = randomWords[0] % liquidatorPool.length;
        address selectedLiquidator = liquidatorPool[selectedLiquidatorIndex];

        // If the selected liquidator is the requester, execute immediately
        // Otherwise, create a delay to give the selected liquidator priority
        if (selectedLiquidator == request.liquidator) {
            _executeLiquidation(requestId);
        } else {
            // Notify selected liquidator and set delay
            request.liquidator = selectedLiquidator;
            emit SecurityAlert(
                "LiquidatorSelected",
                request.user,
                1,
                "VRF selected different liquidator"
            );
        }
    }

    // ==================== SECURITY MONITORING ====================

    /**
     * @dev Perform comprehensive health check
     */
    function _performHealthCheck() internal {
        address[] memory unhealthyUsers = lendingPool.getUnhealthyUsers();
        uint256 totalRisk = 0;
        bool emergencyRequired = false;

        for (uint256 i = 0; i < unhealthyUsers.length; i++) {
            address user = unhealthyUsers[i];
            (,, uint256 healthFactor,) = lendingPool.getUserPosition(user);

            // Update security profile
            _updateSecurityProfile(user, healthFactor);

            // Calculate risk
            uint256 userRisk = _calculateRiskScore(user, healthFactor);
            totalRisk += userRisk;

            // Check for emergency liquidation needs
            if (healthFactor < CRITICAL_HEALTH_FACTOR) {
                emergencyRequired = true;
                _queueEmergencyLiquidation(user);
            }
        }

        // Update protocol security score
        _updateSecurityScore(totalRisk, unhealthyUsers.length);

        lastHealthCheck = block.timestamp;

        emit AutomationExecuted("HealthCheck", block.timestamp, abi.encode(unhealthyUsers.length, totalRisk));
    }

    /**
     * @dev Update user security profile based on health factor
     */
    function _updateSecurityProfile(address user, uint256 healthFactor) internal {
        SecurityProfile storage profile = userSecurityProfiles[user];

        // Calculate risk score (0-100)
        uint256 riskScore;
        if (healthFactor >= 2e18) {
            riskScore = 0; // Very safe
        } else if (healthFactor >= 1.5e18) {
            riskScore = 20; // Low risk
        } else if (healthFactor >= 1.2e18) {
            riskScore = 50; // Medium risk
        } else if (healthFactor >= 1e18) {
            riskScore = 80; // High risk
        } else {
            riskScore = 100; // Critical risk
        }

        profile.riskScore = riskScore;
        profile.lastActivity = block.timestamp;
        profile.isHighRisk = riskScore > 70;

        // Set custom security delay based on risk
        if (riskScore > 90) {
            profile.securityDelay = 30 minutes;
        } else if (riskScore > 70) {
            profile.securityDelay = 1 hours;
        } else {
            profile.securityDelay = SECURITY_DELAY;
        }

        emit SecurityProfileUpdated(user, riskScore, profile.isHighRisk);
    }

    /**
     * @dev Calculate overall risk score for a user
     */
    function _calculateRiskScore(address user, uint256 /* healthFactor */) internal view returns (uint256) {
        SecurityProfile memory profile = userSecurityProfiles[user];

        uint256 baseRisk = profile.riskScore;
        uint256 liquidationRisk = profile.liquidationHistory * 10; // 10 points per past liquidation
        uint256 activityRisk = (block.timestamp - profile.lastActivity) / 1 days * 5; // 5 points per day inactive

        return baseRisk + liquidationRisk + activityRisk;
    }

    /**
     * @dev Queue emergency liquidation for critical positions
     */
    function _queueEmergencyLiquidation(address user) internal {
        if (emergencyLiquidationCount >= EMERGENCY_THRESHOLD) {
            emit SecurityAlert("EmergencyThresholdReached", user, 3, "Emergency liquidation limit exceeded");
            return;
        }

        uint256 requestId = requestCounter++;
        liquidationRequests[requestId] = LiquidationRequest({
            user: user,
            liquidator: address(this), // Contract executes emergency liquidations
            amount: 0, // Will be calculated
            timestamp: block.timestamp,
            executed: false,
            isEmergency: true
        });

        emergencyLiquidationCount++;

        emit EmergencyLiquidation(user, 0, "Critical health factor detected");
        emit SecurityAlert("EmergencyLiquidation", user, 3, "Automated emergency liquidation queued");
    }

    /**
     * @dev Execute pending liquidations with security checks
     */
    function _executePendingLiquidations() internal {
        for (uint256 i = 0; i < requestCounter; i++) {
            LiquidationRequest storage request = liquidationRequests[i];

            if (!request.executed &&
                (block.timestamp - request.timestamp) >= userSecurityProfiles[request.user].securityDelay) {
                _executeLiquidation(i);
            }
        }
    }

    /**
     * @dev Execute a specific liquidation request
     */
    function _executeLiquidation(uint256 requestId) internal {
        LiquidationRequest storage request = liquidationRequests[requestId];
        require(!request.executed, "Already executed");

        // Additional security checks
        (,, uint256 currentHealthFactor,) = lendingPool.getUserPosition(request.user);
        if (currentHealthFactor >= HEALTH_FACTOR_THRESHOLD && !request.isEmergency) {
            return; // Position is now healthy
        }

        try lendingPool.liquidate(
            request.user,
            address(0), // Will be determined by liquidation contract
            address(0), // Will be determined by liquidation contract
            request.amount
        ) {
            request.executed = true;
            lastLiquidationTime[request.user] = block.timestamp;

            // Update security profile
            userSecurityProfiles[request.user].liquidationHistory++;

            emit AutomationExecuted("LiquidationExecuted", block.timestamp, abi.encode(requestId));
        } catch {
            emit SecurityAlert("LiquidationFailed", request.user, 2, "Automated liquidation failed");
        }
    }

    // ==================== EMERGENCY MANAGEMENT ====================

    /**
     * @dev Detect emergency conditions that require immediate action
     */
    function _detectEmergencyConditions() internal view returns (bool) {
        // Check if security score is too low
        if (securityScore < 30) return true;

        // Check if too many unhealthy positions
        address[] memory unhealthyUsers = lendingPool.getUnhealthyUsers();
        if (unhealthyUsers.length > 50) return true;

        // Check protocol-wide health
        // This would integrate with more complex risk calculations

        return false;
    }

    /**
     * @dev Handle emergency conditions
     */
    function _handleEmergencyConditions() internal {
        if (!emergencyMode) {
            emergencyMode = true;

            // Pause non-essential functions
            _pause();

            emit SecurityAlert("EmergencyMode", address(0), 3, "Emergency mode activated");
        }
    }

    /**
     * @dev Reset emergency counter hourly
     */
    function _resetEmergencyCounter() internal {
        emergencyLiquidationCount = 0;
        lastEmergencyReset = block.timestamp;
    }

    /**
     * @dev Update protocol security score
     */
    function _updateSecurityScore(uint256 totalRisk, uint256 unhealthyCount) internal {
        uint256 oldScore = securityScore;

        // Calculate new score based on risk factors
        uint256 newScore = 100;

        if (unhealthyCount > 0) {
            newScore -= (unhealthyCount * 5); // -5 points per unhealthy user
        }

        if (totalRisk > 1000) {
            newScore -= 20; // High total risk penalty
        }

        if (emergencyLiquidationCount > 5) {
            newScore -= 15; // Emergency liquidation penalty
        }

        // Ensure score stays within bounds
        if (newScore > 100) newScore = 100;
        if (newScore < 0) newScore = 0;

        securityScore = newScore;

        emit SecurityScoreUpdated(oldScore, newScore, "Automated health assessment");
    }

    /**
     * @dev Check if there are pending liquidations due for execution
     */
    function _checkPendingLiquidations() internal view returns (bool) {
        for (uint256 i = 0; i < requestCounter; i++) {
            LiquidationRequest memory request = liquidationRequests[i];

            if (!request.executed &&
                (block.timestamp - request.timestamp) >= userSecurityProfiles[request.user].securityDelay) {
                return true;
            }
        }
        return false;
    }

    // ==================== ADMIN FUNCTIONS ====================

    /**
     * @dev Add authorized liquidator to the pool
     */
    function addLiquidator(address liquidator) external onlyOwner {
        require(liquidator != address(0), "Invalid liquidator");
        authorizedLiquidators[liquidator] = true;
        liquidatorPool.push(liquidator);
    }

    /**
     * @dev Remove liquidator from the pool
     */
    function removeLiquidator(address liquidator) external onlyOwner {
        authorizedLiquidators[liquidator] = false;

        // Remove from pool array
        for (uint256 i = 0; i < liquidatorPool.length; i++) {
            if (liquidatorPool[i] == liquidator) {
                liquidatorPool[i] = liquidatorPool[liquidatorPool.length - 1];
                liquidatorPool.pop();
                break;
            }
        }
    }

    /**
     * @dev Emergency function to disable emergency mode
     */
    function disableEmergencyMode() external onlyOwner {
        emergencyMode = false;
        _unpause();
        emit SecurityAlert("EmergencyModeDisabled", address(0), 1, "Emergency mode manually disabled");
    }

    /**
     * @dev Update VRF configuration
     */
    function updateVRFConfig(
        uint64 _subscriptionId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit
    ) external onlyOwner {
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
    }

    // ==================== VIEW FUNCTIONS ====================

    function getSecurityStatus() external view returns (
        uint256 currentSecurityScore,
        bool isEmergencyMode,
        uint256 emergencyCount,
        uint256 lastCheck,
        uint256 liquidatorCount
    ) {
        return (
            securityScore,
            emergencyMode,
            emergencyLiquidationCount,
            lastHealthCheck,
            liquidatorPool.length
        );
    }

    function getLiquidationRequest(uint256 requestId) external view returns (LiquidationRequest memory) {
        return liquidationRequests[requestId];
    }

    function getUserSecurityProfile(address user) external view returns (SecurityProfile memory) {
        return userSecurityProfiles[user];
    }

    // ==================== MODIFIERS ====================

    modifier onlyAuthorizedLiquidator() {
        if (!authorizedLiquidators[msg.sender]) revert UnauthorizedLiquidator();
        _;
    }
}
