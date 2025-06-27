// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RateLimiter is Ownable, ReentrancyGuard {

    // Rate limiting strategies
    enum LimitType {
        FIXED_WINDOW,    // Fixed time window
        SLIDING_WINDOW,  // Sliding time window
        TOKEN_BUCKET     // Token bucket algorithm
    }

    // Rate limit configuration
    struct RateLimit {
        uint256 maxRequests;    // Maximum requests allowed
        uint256 windowSize;     // Time window in seconds
        LimitType limitType;    // Type of rate limiting
        bool isActive;          // Whether the limit is active
        uint256 bucketSize;     // For token bucket (optional)
        uint256 refillRate;     // Tokens per second for bucket refill
    }

    // User rate limit state
    struct UserRateState {
        uint256 requestCount;   // Number of requests in current window
        uint256 windowStart;    // Start of current window
        uint256 lastRequest;    // Timestamp of last request
        uint256 tokensAvailable; // Available tokens for bucket algorithm
        uint256 lastRefill;     // Last token refill timestamp
        bool isBlocked;         // Whether user is blocked
        uint256 blockUntil;     // Block until timestamp
    }

    // Global rate limiting
    mapping(string => RateLimit) public rateLimits;

    // User-specific rate limiting
    mapping(address => mapping(string => UserRateState)) public userRateStates;

    // IP-based rate limiting (for frontend integration)
    mapping(bytes32 => mapping(string => UserRateState)) public ipRateStates;

    // Emergency controls
    bool public emergencyMode;
    mapping(address => bool) public emergencyWhitelist;

    // Default configurations
    uint256 public constant DEFAULT_WINDOW = 15 minutes;
    uint256 public constant DEFAULT_MAX_REQUESTS = 10;
    uint256 public constant MAX_WINDOW_SIZE = 24 hours;
    uint256 public constant MIN_WINDOW_SIZE = 1 minutes;

    // Events
    event RateLimitConfigured(string indexed action, uint256 maxRequests, uint256 windowSize, LimitType limitType);
    event RateLimitExceeded(address indexed user, string indexed action, uint256 timestamp);
    event UserBlocked(address indexed user, string indexed action, uint256 blockUntil);
    event UserUnblocked(address indexed user, string indexed action);
    event EmergencyModeToggled(bool enabled);
    event EmergencyWhitelistUpdated(address indexed user, bool whitelisted);

    // Errors
    error RateLimitExceededError();
    error UserBlockedError(uint256 blockUntil);
    error InvalidConfiguration();
    error ActionNotConfigured();
    error EmergencyModeActive();

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Configure rate limit for a specific action
     * @param action The action identifier (e.g., "deposit", "borrow", "withdraw")
     * @param maxRequests Maximum requests allowed in the window
     * @param windowSize Time window in seconds
     * @param limitType Type of rate limiting algorithm
     * @param bucketSize Size of token bucket (only for TOKEN_BUCKET type)
     * @param refillRate Tokens per second refill rate (only for TOKEN_BUCKET type)
     */
    function configureRateLimit(
        string calldata action,
        uint256 maxRequests,
        uint256 windowSize,
        LimitType limitType,
        uint256 bucketSize,
        uint256 refillRate
    ) external onlyOwner {
        require(maxRequests > 0, "Max requests must be > 0");
        require(windowSize >= MIN_WINDOW_SIZE && windowSize <= MAX_WINDOW_SIZE, "Invalid window size");

        if (limitType == LimitType.TOKEN_BUCKET) {
            require(bucketSize > 0 && refillRate > 0, "Invalid bucket configuration");
        }

        rateLimits[action] = RateLimit({
            maxRequests: maxRequests,
            windowSize: windowSize,
            limitType: limitType,
            isActive: true,
            bucketSize: bucketSize,
            refillRate: refillRate
        });

        emit RateLimitConfigured(action, maxRequests, windowSize, limitType);
    }

    /**
     * @dev Check if user can perform an action (view function)
     * @param user The user address
     * @param action The action identifier
     * @return allowed Whether the action is allowed
     * @return waitTime How long to wait before retry (0 if allowed)
     */
    function checkRateLimit(address user, string calldata action)
        external
        view
        returns (bool allowed, uint256 waitTime)
    {
        // Emergency mode check
        if (emergencyMode && !emergencyWhitelist[user]) {
            return (false, type(uint256).max);
        }

        RateLimit memory limit = rateLimits[action];
        if (!limit.isActive) {
            return (true, 0);
        }

        UserRateState memory state = userRateStates[user][action];

        // Check if user is blocked
        if (state.isBlocked && block.timestamp < state.blockUntil) {
            return (false, state.blockUntil - block.timestamp);
        }

        return _checkLimit(state, limit);
    }

    /**
     * @dev Check and update rate limit for a user action
     * @param user The user address
     * @param action The action identifier
     */
    function enforceRateLimit(address user, string calldata action) external {
        // Emergency mode check
        if (emergencyMode && !emergencyWhitelist[user]) {
            revert EmergencyModeActive();
        }

        RateLimit memory limit = rateLimits[action];
        if (!limit.isActive) {
            return; // No rate limiting for this action
        }

        UserRateState storage state = userRateStates[user][action];

        // Check if user is blocked
        if (state.isBlocked && block.timestamp < state.blockUntil) {
            revert UserBlockedError(state.blockUntil);
        }

        // Unblock user if block period has expired
        if (state.isBlocked && block.timestamp >= state.blockUntil) {
            state.isBlocked = false;
            state.blockUntil = 0;
            emit UserUnblocked(user, action);
        }

        // Check and update rate limit
        (bool allowed, ) = _checkLimit(state, limit);
        if (!allowed) {
            // Block user for escalating violations
            _handleViolation(user, action, state, limit);
            revert RateLimitExceededError();
        }

        // Update state
        _updateRateState(state, limit);
    }

    /**
     * @dev Check rate limit for IP address (for frontend integration)
     * @param ipHash Keccak256 hash of IP address
     * @param action The action identifier
     * @return allowed Whether the action is allowed
     * @return waitTime How long to wait before retry
     */
    function checkIPRateLimit(bytes32 ipHash, string calldata action)
        external
        view
        returns (bool allowed, uint256 waitTime)
    {
        RateLimit memory limit = rateLimits[action];
        if (!limit.isActive) {
            return (true, 0);
        }

        UserRateState memory state = ipRateStates[ipHash][action];
        return _checkLimit(state, limit);
    }

    /**
     * @dev Enforce rate limit for IP address
     * @param ipHash Keccak256 hash of IP address
     * @param action The action identifier
     */
    function enforceIPRateLimit(bytes32 ipHash, string calldata action) external {
        RateLimit memory limit = rateLimits[action];
        if (!limit.isActive) {
            return;
        }

        UserRateState storage state = ipRateStates[ipHash][action];

        (bool allowed, ) = _checkLimit(state, limit);
        if (!allowed) {
            revert RateLimitExceededError();
        }

        _updateRateState(state, limit);
    }

    /**
     * @dev Get user's current rate limit state
     * @param user The user address
     * @param action The action identifier
     * @return requestCount Current request count
     * @return windowStart Start of current window
     * @return tokensAvailable Available tokens (for bucket algorithm)
     * @return isBlocked Whether user is blocked
     * @return blockUntil Block until timestamp
     */
    function getUserRateState(address user, string calldata action)
        external
        view
        returns (
            uint256 requestCount,
            uint256 windowStart,
            uint256 tokensAvailable,
            bool isBlocked,
            uint256 blockUntil
        )
    {
        UserRateState memory state = userRateStates[user][action];
        return (
            state.requestCount,
            state.windowStart,
            state.tokensAvailable,
            state.isBlocked,
            state.blockUntil
        );
    }

    /**
     * @dev Reset rate limit state for a user
     * @param user The user address
     * @param action The action identifier
     */
    function resetUserRateLimit(address user, string calldata action) external onlyOwner {
        delete userRateStates[user][action];
    }

    /**
     * @dev Block a user for a specific action
     * @param user The user address
     * @param action The action identifier
     * @param blockDuration Duration to block in seconds
     */
    function blockUser(address user, string calldata action, uint256 blockDuration) external onlyOwner {
        UserRateState storage state = userRateStates[user][action];
        state.isBlocked = true;
        state.blockUntil = block.timestamp + blockDuration;

        emit UserBlocked(user, action, state.blockUntil);
    }

    /**
     * @dev Unblock a user for a specific action
     * @param user The user address
     * @param action The action identifier
     */
    function unblockUser(address user, string calldata action) external onlyOwner {
        UserRateState storage state = userRateStates[user][action];
        state.isBlocked = false;
        state.blockUntil = 0;

        emit UserUnblocked(user, action);
    }

    /**
     * @dev Toggle emergency mode
     * @param enabled Whether to enable emergency mode
     */
    function setEmergencyMode(bool enabled) external onlyOwner {
        emergencyMode = enabled;
        emit EmergencyModeToggled(enabled);
    }

    /**
     * @dev Update emergency whitelist
     * @param user The user address
     * @param whitelisted Whether to whitelist the user
     */
    function setEmergencyWhitelist(address user, bool whitelisted) external onlyOwner {
        emergencyWhitelist[user] = whitelisted;
        emit EmergencyWhitelistUpdated(user, whitelisted);
    }

    /**
     * @dev Disable rate limiting for a specific action
     * @param action The action identifier
     */
    function disableRateLimit(string calldata action) external onlyOwner {
        rateLimits[action].isActive = false;
    }

    /**
     * @dev Enable rate limiting for a specific action
     * @param action The action identifier
     */
    function enableRateLimit(string calldata action) external onlyOwner {
        require(rateLimits[action].maxRequests > 0, "Rate limit not configured");
        rateLimits[action].isActive = true;
    }

    // Internal functions

    function _checkLimit(UserRateState memory state, RateLimit memory limit)
        internal
        view
        returns (bool allowed, uint256 waitTime)
    {
        if (limit.limitType == LimitType.FIXED_WINDOW) {
            return _checkFixedWindow(state, limit);
        } else if (limit.limitType == LimitType.SLIDING_WINDOW) {
            return _checkSlidingWindow(state, limit);
        } else if (limit.limitType == LimitType.TOKEN_BUCKET) {
            return _checkTokenBucket(state, limit);
        }

        return (true, 0);
    }

    function _checkFixedWindow(UserRateState memory state, RateLimit memory limit)
        internal
        view
        returns (bool allowed, uint256 waitTime)
    {
        uint256 currentWindow = block.timestamp / limit.windowSize;
        uint256 stateWindow = state.windowStart / limit.windowSize;

        if (currentWindow > stateWindow) {
            // New window, reset allowed
            return (true, 0);
        }

        if (state.requestCount >= limit.maxRequests) {
            // Rate limit exceeded
            uint256 nextWindow = (currentWindow + 1) * limit.windowSize;
            return (false, nextWindow - block.timestamp);
        }

        return (true, 0);
    }

    function _checkSlidingWindow(UserRateState memory state, RateLimit memory limit)
        internal
        view
        returns (bool allowed, uint256 waitTime)
    {
        if (block.timestamp >= state.windowStart + limit.windowSize) {
            // Window has passed, reset allowed
            return (true, 0);
        }

        if (state.requestCount >= limit.maxRequests) {
            // Rate limit exceeded
            return (false, (state.windowStart + limit.windowSize) - block.timestamp);
        }

        return (true, 0);
    }

    function _checkTokenBucket(UserRateState memory state, RateLimit memory limit)
        internal
        view
        returns (bool allowed, uint256 waitTime)
    {
        // Calculate tokens to add based on time passed
        uint256 tokensToAdd = 0;
        if (state.lastRefill > 0) {
            uint256 timePassed = block.timestamp - state.lastRefill;
            tokensToAdd = timePassed * limit.refillRate;
        }

        uint256 currentTokens = state.tokensAvailable + tokensToAdd;
        if (currentTokens > limit.bucketSize) {
            currentTokens = limit.bucketSize;
        }

        if (currentTokens == 0) {
            // No tokens available, calculate wait time
            return (false, 1); // Wait at least 1 second for refill
        }

        return (true, 0);
    }

    function _updateRateState(UserRateState storage state, RateLimit memory limit) internal {
        if (limit.limitType == LimitType.FIXED_WINDOW) {
            uint256 currentWindow = block.timestamp / limit.windowSize;
            uint256 stateWindow = state.windowStart / limit.windowSize;

            if (currentWindow > stateWindow) {
                // New window
                state.requestCount = 1;
                state.windowStart = block.timestamp;
            } else {
                state.requestCount++;
            }
        } else if (limit.limitType == LimitType.SLIDING_WINDOW) {
            if (block.timestamp >= state.windowStart + limit.windowSize) {
                // New window
                state.requestCount = 1;
                state.windowStart = block.timestamp;
            } else {
                state.requestCount++;
            }
        } else if (limit.limitType == LimitType.TOKEN_BUCKET) {
            // Refill tokens
            uint256 tokensToAdd = 0;
            if (state.lastRefill > 0) {
                uint256 timePassed = block.timestamp - state.lastRefill;
                tokensToAdd = timePassed * limit.refillRate;
            } else {
                // First time, start with full bucket
                state.tokensAvailable = limit.bucketSize;
            }

            state.tokensAvailable += tokensToAdd;
            if (state.tokensAvailable > limit.bucketSize) {
                state.tokensAvailable = limit.bucketSize;
            }

            // Consume one token
            state.tokensAvailable--;
            state.lastRefill = block.timestamp;
        }

        state.lastRequest = block.timestamp;
    }

    function _handleViolation(
        address user,
        string calldata action,
        UserRateState storage state,
        RateLimit memory limit
    ) internal {
        // Implement progressive blocking for repeat violations
        uint256 blockDuration = 1 hours; // Base block duration

        // Escalate based on recent violations
        if (state.lastRequest > 0 && block.timestamp - state.lastRequest < limit.windowSize) {
            blockDuration = blockDuration * 2; // Double the block time
        }

        state.isBlocked = true;
        state.blockUntil = block.timestamp + blockDuration;

        emit RateLimitExceeded(user, action, state.blockUntil);
        emit UserBlocked(user, action, state.blockUntil);
    }
}
