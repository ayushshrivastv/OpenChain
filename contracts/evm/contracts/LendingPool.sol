// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./ChainlinkPriceFeed.sol";
import "./LiquidationManager.sol";
import "./RateLimiter.sol";
import "./Permissions.sol";

// Interface for synthetic assets (mint/burn)
interface ISyntheticAsset {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

contract LendingPool is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable
{
    using SafeERC20 for IERC20;

    // Core protocol parameters
    uint256 public constant LIQUIDATION_THRESHOLD = 80e18; // 80% (18 decimals)
    uint256 public constant LIQUIDATION_BONUS = 5e18; // 5% bonus for liquidators
    uint256 public constant MIN_HEALTH_FACTOR = 1e18; // 1.0
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_BORROW_RATE = 75e18; // 75% max borrow rate

    // CCIP Configuration
    address public ccipRouter;
    address public linkToken;
    uint256 public ccipGasLimit;
    mapping(uint64 => bool) public supportedChains;
    mapping(bytes32 => bool) public processedMessages;

    // Protocol contracts
    ChainlinkPriceFeed public priceFeed;
    LiquidationManager public liquidationManager;
    RateLimiter public rateLimiter;
    Permissions public permissions;

    // Asset configuration
    struct Asset {
        address token;
        address priceFeed;
        address synthToken; // Synthetic representation for cross-chain
        uint256 decimals;
        uint256 ltv; // Loan-to-value ratio (e.g., 75%)
        uint256 liquidationThreshold;
        bool isActive;
        bool canBeBorrowed;
        bool canBeCollateral;
    }
    mapping(address => Asset) public supportedAssets;
    address[] public assetsList;

    // User positions
    struct UserPosition {
        mapping(address => uint256) collateralBalance;
        mapping(address => uint256) borrowBalance;
        uint256 totalCollateralValue; // USD value with 18 decimals
        uint256 totalBorrowValue; // USD value with 18 decimals
        uint256 healthFactor;
        uint256 lastUpdateTimestamp;
    }
    mapping(address => UserPosition) internal userPositions;

    // Cross-chain message structure
    struct CrossChainMessage {
        address user;
        string action; // "borrow", "repay", "withdraw", "deposit"
        address asset;
        uint256 amount;
        uint64 sourceChain;
        uint64 destChain;
        address receiver;
    }

    // Events
    event Deposit(address indexed user, address indexed asset, uint256 amount, uint64 indexed chainSelector);
    event Borrow(address indexed user, address indexed asset, uint256 amount, uint64 indexed destChain, bytes32 ccipMessageId);
    event Repay(address indexed user, address indexed asset, uint256 amount, uint64 indexed sourceChain);
    event Withdraw(address indexed user, address indexed asset, uint256 amount, uint64 indexed destChain);
    event CrossChainMessageSent(bytes32 indexed messageId, address indexed user, string action, uint256 amount);
    event CrossChainMessageReceived(bytes32 indexed messageId, address indexed user, string action, uint256 amount);
    event Liquidation(address indexed user, address indexed asset, uint256 debtRepaid, uint256 collateralSeized, address indexed liquidator);
    event AssetAdded(address indexed asset, address priceFeed, address synthToken);
    event HealthFactorUpdated(address indexed user, uint256 oldHealthFactor, uint256 newHealthFactor);

    // Errors
    error InsufficientCollateral();
    error AssetNotSupported();
    error ExceedsMaxBorrowRate();
    error HealthFactorTooLow();
    error InvalidAmount();
    error ChainNotSupported();
    error MessageAlreadyProcessed();
    error InsufficientBalance();
    error LiquidationNotAllowed();
    error CCIPMessageFailed();

    modifier onlyAuthorized() {
        require(permissions.canPerformAction(msg.sender, "deposit") || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier validAsset(address asset) {
        if (!supportedAssets[asset].isActive) revert AssetNotSupported();
        _;
    }

    modifier rateLimited() {
        rateLimiter.enforceRateLimit(msg.sender, "deposit");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _ccipRouter,
        address _linkToken,
        address _priceFeed,
        address _liquidationManager,
        address _rateLimiter,
        address _permissions
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __Pausable_init();

        require(_ccipRouter != address(0), "Invalid CCIP router");
        require(_linkToken != address(0), "Invalid LINK token");
        require(_priceFeed != address(0), "Invalid price feed");
        require(_liquidationManager != address(0), "Invalid liquidation manager");
        require(_rateLimiter != address(0), "Invalid rate limiter");
        require(_permissions != address(0), "Invalid permissions");

        ccipRouter = _ccipRouter;
        linkToken = _linkToken;
        ccipGasLimit = 500000; // Default gas limit for CCIP messages

        priceFeed = ChainlinkPriceFeed(_priceFeed);
        liquidationManager = LiquidationManager(_liquidationManager);
        rateLimiter = RateLimiter(_rateLimiter);
        permissions = Permissions(_permissions);
    }

    // ==================== CCIP FUNCTIONS ====================

    function _sendCrossChainMessage(
        uint64 destChainSelector,
        CrossChainMessage memory message
    ) internal returns (bytes32) {
        // Create CCIP message
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(address(this)),
            data: abi.encode(message),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: ccipGasLimit})),
            feeToken: linkToken
        });

        // Calculate fee
        uint256 fees = IRouterClient(ccipRouter).getFee(destChainSelector, evm2AnyMessage);

        // Check LINK balance
        if (IERC20(linkToken).balanceOf(address(this)) < fees) {
            revert CCIPMessageFailed();
        }

        // Approve router to spend LINK
        IERC20(linkToken).approve(ccipRouter, fees);

        // Send message
        bytes32 messageId = IRouterClient(ccipRouter).ccipSend(destChainSelector, evm2AnyMessage);

        emit CrossChainMessageSent(messageId, message.user, message.action, message.amount);
        return messageId;
    }

    function ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) external {
        require(msg.sender == ccipRouter, "Only router can call");

        bytes32 messageId = any2EvmMessage.messageId;
        if (processedMessages[messageId]) revert MessageAlreadyProcessed();
        processedMessages[messageId] = true;

        CrossChainMessage memory ccipMessage = abi.decode(any2EvmMessage.data, (CrossChainMessage));

        // Process the message based on action
        if (keccak256(bytes(ccipMessage.action)) == keccak256("borrow")) {
            // Mint synthetic asset to user
            ISyntheticAsset(supportedAssets[ccipMessage.asset].synthToken).mint(
                ccipMessage.receiver != address(0) ? ccipMessage.receiver : ccipMessage.user,
                ccipMessage.amount
            );
        } else if (keccak256(bytes(ccipMessage.action)) == keccak256("repay")) {
            // Burn synthetic asset and update position
            ISyntheticAsset(supportedAssets[ccipMessage.asset].synthToken).burn(
                ccipMessage.user,
                ccipMessage.amount
            );
        }

        emit CrossChainMessageReceived(messageId, ccipMessage.user, ccipMessage.action, ccipMessage.amount);
    }

    // ==================== ASSET MANAGEMENT ====================

    function addSupportedAsset(
        address token,
        address priceFeedAddress,
        address synthToken,
        uint256 ltv,
        uint256 liquidationThreshold,
        bool canBeBorrowed,
        bool canBeCollateral
    ) external onlyOwner {
        require(token != address(0) && priceFeedAddress != address(0), "Invalid addresses");
        require(ltv <= MAX_BORROW_RATE && liquidationThreshold <= 100e18, "Invalid parameters");

        supportedAssets[token] = Asset({
            token: token,
            priceFeed: priceFeedAddress,
            synthToken: synthToken,
            decimals: IERC20Metadata(token).decimals(),
            ltv: ltv,
            liquidationThreshold: liquidationThreshold,
            isActive: true,
            canBeBorrowed: canBeBorrowed,
            canBeCollateral: canBeCollateral
        });

        assetsList.push(token);
        emit AssetAdded(token, priceFeedAddress, synthToken);
    }

    function setSupportedChain(uint64 chainSelector, bool supported) external onlyOwner {
        supportedChains[chainSelector] = supported;
    }

    // ==================== CORE LENDING FUNCTIONS ====================

    function deposit(address asset, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        validAsset(asset)
        rateLimited
    {
        if (amount == 0) revert InvalidAmount();
        if (!supportedAssets[asset].canBeCollateral) revert AssetNotSupported();

        // Transfer tokens from user
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Update user position
        userPositions[msg.sender].collateralBalance[asset] += amount;

        // Update health factor and total collateral value
        _updateUserPosition(msg.sender);

        emit Deposit(msg.sender, asset, amount, 0);
    }

    function borrow(
        address asset,
        uint256 amount,
        uint64 destChainSelector,
        address receiver
    )
        external
        nonReentrant
        whenNotPaused
        validAsset(asset)
        rateLimited
        returns (bytes32)
    {
        if (amount == 0) revert InvalidAmount();
        if (!supportedAssets[asset].canBeBorrowed) revert AssetNotSupported();
        if (!supportedChains[destChainSelector]) revert ChainNotSupported();

        // Check if user has sufficient collateral
        _updateUserPosition(msg.sender);

        uint256 assetPrice = _getAssetPrice(asset);
        uint256 borrowValueUSD = (amount * assetPrice) / (10 ** supportedAssets[asset].decimals);

        // Calculate new total borrow value
        uint256 newTotalBorrowValue = userPositions[msg.sender].totalBorrowValue + borrowValueUSD;

        // Check LTV ratio
        uint256 maxBorrowValue = (userPositions[msg.sender].totalCollateralValue * supportedAssets[asset].ltv) / PRECISION;
        if (newTotalBorrowValue > maxBorrowValue) revert ExceedsMaxBorrowRate();

        // Update borrow balance
        userPositions[msg.sender].borrowBalance[asset] += amount;
        userPositions[msg.sender].totalBorrowValue = newTotalBorrowValue;

        // Calculate new health factor
        uint256 newHealthFactor = _calculateHealthFactor(msg.sender);
        if (newHealthFactor < MIN_HEALTH_FACTOR) revert HealthFactorTooLow();

        userPositions[msg.sender].healthFactor = newHealthFactor;

        // Send cross-chain message via CCIP
        bytes32 messageId;
        if (destChainSelector != 0) {
            messageId = _sendCrossChainMessage(
                destChainSelector,
                CrossChainMessage({
                    user: msg.sender,
                    action: "borrow",
                    asset: asset,
                    amount: amount,
                    sourceChain: 0, // Current chain
                    destChain: destChainSelector,
                    receiver: receiver
                })
            );
        } else {
            // Same chain borrow - mint synthetic asset directly
            ISyntheticAsset(supportedAssets[asset].synthToken).mint(msg.sender, amount);
        }

        emit Borrow(msg.sender, asset, amount, destChainSelector, messageId);
        return messageId;
    }

    function repay(address asset, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        validAsset(asset)
    {
        if (amount == 0) revert InvalidAmount();

        uint256 userDebt = userPositions[msg.sender].borrowBalance[asset];
        if (amount > userDebt) {
            amount = userDebt; // Only repay up to the debt amount
        }

        // Transfer repayment from user
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Update user position
        userPositions[msg.sender].borrowBalance[asset] -= amount;

        // Update health factor and total borrow value
        _updateUserPosition(msg.sender);

        emit Repay(msg.sender, asset, amount, 0);
    }

    function withdraw(address asset, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        validAsset(asset)
    {
        if (amount == 0) revert InvalidAmount();

        uint256 userCollateral = userPositions[msg.sender].collateralBalance[asset];
        if (amount > userCollateral) revert InsufficientBalance();

        // Update user position temporarily to check health factor
        userPositions[msg.sender].collateralBalance[asset] -= amount;
        _updateUserPosition(msg.sender);

        // Check if withdrawal would make position unhealthy
        uint256 newHealthFactor = _calculateHealthFactor(msg.sender);
        if (newHealthFactor < MIN_HEALTH_FACTOR && userPositions[msg.sender].totalBorrowValue > 0) {
            // Revert the change
            userPositions[msg.sender].collateralBalance[asset] += amount;
            _updateUserPosition(msg.sender);
            revert HealthFactorTooLow();
        }

        // Transfer tokens to user
        IERC20(asset).safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, asset, amount, 0);
    }

    // ==================== LIQUIDATION ====================

    function liquidate(address user, address collateralAsset, address debtAsset, uint256 debtAmount)
        external
        nonReentrant
        whenNotPaused
    {
        // Check if liquidation is allowed
        _updateUserPosition(user);
        if (userPositions[user].healthFactor >= MIN_HEALTH_FACTOR) revert LiquidationNotAllowed();

        uint256 userDebt = userPositions[user].borrowBalance[debtAsset];
        if (debtAmount > userDebt) {
            debtAmount = userDebt;
        }

        // Calculate collateral to seize
        uint256 collateralPrice = _getAssetPrice(collateralAsset);
        uint256 debtPrice = _getAssetPrice(debtAsset);

        uint256 collateralAmountToSeize = (debtAmount * debtPrice * (PRECISION + LIQUIDATION_BONUS)) /
                                         (collateralPrice * PRECISION);

        // Ensure there's enough collateral
        if (collateralAmountToSeize > userPositions[user].collateralBalance[collateralAsset]) {
            collateralAmountToSeize = userPositions[user].collateralBalance[collateralAsset];
        }

        // Transfer debt repayment from liquidator
        IERC20(debtAsset).safeTransferFrom(msg.sender, address(this), debtAmount);

        // Transfer collateral to liquidator
        IERC20(collateralAsset).safeTransfer(msg.sender, collateralAmountToSeize);

        // Update user position
        userPositions[user].borrowBalance[debtAsset] -= debtAmount;
        userPositions[user].collateralBalance[collateralAsset] -= collateralAmountToSeize;

        _updateUserPosition(user);

        emit Liquidation(user, collateralAsset, debtAmount, collateralAmountToSeize, msg.sender);
    }

    // ==================== VIEW FUNCTIONS ====================

    function getUserPosition(address user) external view returns (
        uint256 totalCollateralValue,
        uint256 totalBorrowValue,
        uint256 healthFactor,
        uint256 maxBorrowValue
    ) {
        UserPosition storage position = userPositions[user];
        return (
            position.totalCollateralValue,
            position.totalBorrowValue,
            position.healthFactor,
            (position.totalCollateralValue * MAX_BORROW_RATE) / PRECISION
        );
    }

    function getUserAssetBalance(address user, address asset) external view returns (
        uint256 collateralBalance,
        uint256 borrowBalance
    ) {
        return (
            userPositions[user].collateralBalance[asset],
            userPositions[user].borrowBalance[asset]
        );
    }

    function getAssetPrice(address asset) external view returns (uint256) {
        return _getAssetPrice(asset);
    }

    function getSupportedAssets() external view returns (address[] memory) {
        return assetsList;
    }

    // ==================== INTERNAL FUNCTIONS ====================

    function _updateUserPosition(address user) internal {
        UserPosition storage position = userPositions[user];

        uint256 totalCollateralValue = 0;
        uint256 totalBorrowValue = 0;

        // Calculate total collateral value
        for (uint256 i = 0; i < assetsList.length; i++) {
            address asset = assetsList[i];
            uint256 balance = position.collateralBalance[asset];

            if (balance > 0) {
                uint256 assetPrice = _getAssetPrice(asset);
                uint256 assetValue = (balance * assetPrice) / (10 ** supportedAssets[asset].decimals);
                totalCollateralValue += assetValue;
            }

            uint256 borrowBalance = position.borrowBalance[asset];
            if (borrowBalance > 0) {
                uint256 assetPrice = _getAssetPrice(asset);
                uint256 borrowValue = (borrowBalance * assetPrice) / (10 ** supportedAssets[asset].decimals);
                totalBorrowValue += borrowValue;
            }
        }

        position.totalCollateralValue = totalCollateralValue;
        position.totalBorrowValue = totalBorrowValue;

        uint256 newHealthFactor = _calculateHealthFactor(user);

        if (newHealthFactor != position.healthFactor) {
            emit HealthFactorUpdated(user, position.healthFactor, newHealthFactor);
            position.healthFactor = newHealthFactor;
        }

        position.lastUpdateTimestamp = block.timestamp;
    }

    function _calculateHealthFactor(address user) internal view returns (uint256) {
        UserPosition storage position = userPositions[user];

        if (position.totalBorrowValue == 0) {
            return type(uint256).max; // No debt means infinite health factor
        }

        uint256 liquidationThresholdValue = 0;

        // Calculate weighted average liquidation threshold
        for (uint256 i = 0; i < assetsList.length; i++) {
            address asset = assetsList[i];
            uint256 balance = position.collateralBalance[asset];

            if (balance > 0) {
                uint256 assetPrice = _getAssetPrice(asset);
                uint256 assetValue = (balance * assetPrice) / (10 ** supportedAssets[asset].decimals);
                liquidationThresholdValue += (assetValue * supportedAssets[asset].liquidationThreshold) / PRECISION;
            }
        }

        return (liquidationThresholdValue * PRECISION) / position.totalBorrowValue;
    }

    function _getAssetPrice(address asset) internal view returns (uint256) {
        (int256 price, uint8 decimals) = priceFeed.getPrice(supportedAssets[asset].priceFeed);
        require(price > 0, "Invalid price");

        // Normalize to 18 decimals
        if (decimals < 18) {
            return uint256(price) * 10**(18 - decimals);
        } else if (decimals > 18) {
            return uint256(price) / 10**(decimals - 18);
        }
        return uint256(price);
    }

    // ==================== ADMIN FUNCTIONS ====================

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setCCIPGasLimit(uint256 gasLimit) external onlyOwner {
        ccipGasLimit = gasLimit;
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    // ==================== UPGRADE AUTHORIZATION ====================

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
