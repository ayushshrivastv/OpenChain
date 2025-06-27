// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ChainlinkPriceFeed.sol";

interface ILendingPool {
    function getUserPosition(address user) external view returns (
        uint256 totalCollateralValue,
        uint256 totalBorrowValue,
        uint256 healthFactor,
        uint256 maxBorrowValue
    );

    function getUserAssetBalance(address user, address asset) external view returns (
        uint256 collateralBalance,
        uint256 borrowBalance
    );

    function liquidate(address user, address collateralAsset, address debtAsset, uint256 debtAmount) external;

    function getSupportedAssets() external view returns (address[] memory);
}

contract LiquidationManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_HEALTH_FACTOR = 1e18; // 1.0
    uint256 public constant LIQUIDATION_THRESHOLD = 95e16; // 0.95 - Liquidate when health factor drops below this
    uint256 public constant MAX_LIQUIDATION_CLOSE_FACTOR = 50e16; // 50% - Maximum portion of debt that can be liquidated
    uint256 public constant LIQUIDATION_BONUS = 5e16; // 5% bonus for liquidators

    // State variables
    ILendingPool public lendingPool;
    ChainlinkPriceFeed public priceFeed;

    // Liquidation configuration per asset
    struct LiquidationConfig {
        uint256 liquidationThreshold; // Health factor threshold for liquidation
        uint256 liquidationBonus; // Bonus percentage for liquidators
        uint256 closeFactor; // Maximum percentage of debt that can be liquidated
        bool isActive;
    }

    mapping(address => LiquidationConfig) public liquidationConfigs;

    // Liquidator whitelist (optional - can be disabled)
    mapping(address => bool) public authorizedLiquidators;
    bool public liquidatorWhitelistEnabled;

    // Liquidation statistics
    struct LiquidationStats {
        uint256 totalLiquidations;
        uint256 totalValueLiquidated;
        uint256 totalBonusPaid;
        mapping(address => uint256) assetLiquidationCount;
        mapping(address => uint256) userLiquidationCount;
    }

    LiquidationStats public stats;

    // Events
    event LiquidationExecuted(
        address indexed liquidator,
        address indexed user,
        address indexed collateralAsset,
        address debtAsset,
        uint256 debtAmount,
        uint256 collateralSeized,
        uint256 bonus
    );
    event LiquidationConfigUpdated(address indexed asset, uint256 threshold, uint256 bonus, uint256 closeFactor);
    event LiquidatorAuthorized(address indexed liquidator, bool authorized);
    event WhitelistToggled(bool enabled);
    event UnhealthyPositionDetected(address indexed user, uint256 healthFactor);
    event EmergencyLiquidation(address indexed user, uint256 healthFactor);

    // Errors
    error PositionHealthy();
    error UnauthorizedLiquidator();
    error InvalidLiquidationAmount();
    error InsufficientCollateral();
    error LiquidationConfigNotFound();
    error InvalidConfiguration();

    modifier onlyAuthorizedLiquidator() {
        if (liquidatorWhitelistEnabled && !authorizedLiquidators[msg.sender]) {
            revert UnauthorizedLiquidator();
        }
        _;
    }

    constructor(address _lendingPool, address _priceFeed) Ownable(msg.sender) {
        lendingPool = ILendingPool(_lendingPool);
        priceFeed = ChainlinkPriceFeed(_priceFeed);
    }

    /**
     * @dev Set liquidation configuration for an asset
     * @param asset The asset address
     * @param liquidationThreshold Health factor threshold for liquidation
     * @param liquidationBonus Bonus percentage for liquidators
     * @param closeFactor Maximum percentage of debt that can be liquidated
     */
    function setLiquidationConfig(
        address asset,
        uint256 liquidationThreshold,
        uint256 liquidationBonus,
        uint256 closeFactor
    ) external onlyOwner {
        require(liquidationThreshold <= PRECISION, "Invalid threshold");
        require(liquidationBonus <= 20e16, "Bonus too high"); // Max 20%
        require(closeFactor <= PRECISION, "Invalid close factor");

        liquidationConfigs[asset] = LiquidationConfig({
            liquidationThreshold: liquidationThreshold,
            liquidationBonus: liquidationBonus,
            closeFactor: closeFactor,
            isActive: true
        });

        emit LiquidationConfigUpdated(asset, liquidationThreshold, liquidationBonus, closeFactor);
    }

    /**
     * @dev Check if a position can be liquidated
     * @param user The user address
     * @return liquidatable Whether the position can be liquidated
     * @return healthFactor Current health factor
     */
    function canLiquidate(address user) external view returns (bool liquidatable, uint256 healthFactor) {
        (, , healthFactor, ) = lendingPool.getUserPosition(user);
        liquidatable = healthFactor < LIQUIDATION_THRESHOLD && healthFactor > 0;
    }

    /**
     * @dev Calculate optimal liquidation parameters
     * @param user The user to liquidate
     * @param collateralAsset The collateral asset to seize
     * @param debtAsset The debt asset to repay
     * @return optimalDebtAmount Optimal debt amount to repay
     * @return collateralToSeize Amount of collateral that will be seized
     * @return liquidatorBonus Bonus amount for the liquidator
     */
    function calculateLiquidation(
        address user,
        address collateralAsset,
        address debtAsset
    ) external view returns (
        uint256 optimalDebtAmount,
        uint256 collateralToSeize,
        uint256 liquidatorBonus
    ) {
        // Get user's debt in the specified asset
        (, uint256 userDebt) = lendingPool.getUserAssetBalance(user, debtAsset);
        (uint256 userCollateral, ) = lendingPool.getUserAssetBalance(user, collateralAsset);

        if (userDebt == 0 || userCollateral == 0) return (0, 0, 0);

        // Get liquidation config
        LiquidationConfig memory config = liquidationConfigs[debtAsset];
        if (!config.isActive) config = _getDefaultConfig();

        // Calculate maximum liquidatable debt (based on close factor)
        uint256 maxLiquidatableDebt = (userDebt * config.closeFactor) / PRECISION;

        // Get asset prices
        (uint256 collateralPrice, ) = priceFeed.getSafePrice(collateralAsset);
        (uint256 debtPrice, ) = priceFeed.getSafePrice(debtAsset);

        require(collateralPrice > 0 && debtPrice > 0, "Invalid prices");

        // Calculate collateral needed (including bonus)
        uint256 collateralValueNeeded = (maxLiquidatableDebt * debtPrice * (PRECISION + config.liquidationBonus)) / PRECISION;
        uint256 maxCollateralToSeize = collateralValueNeeded / collateralPrice;

        // Ensure we don't seize more collateral than available
        if (maxCollateralToSeize > userCollateral) {
            maxCollateralToSeize = userCollateral;
            // Recalculate debt amount based on available collateral
            maxLiquidatableDebt = (maxCollateralToSeize * collateralPrice) /
                                  ((debtPrice * (PRECISION + config.liquidationBonus)) / PRECISION);
        }

        optimalDebtAmount = maxLiquidatableDebt;
        collateralToSeize = maxCollateralToSeize;
        liquidatorBonus = (collateralToSeize * collateralPrice * config.liquidationBonus) /
                         (PRECISION * collateralPrice); // Simplified to just the bonus portion
    }

    /**
     * @dev Execute liquidation
     * @param user The user to liquidate
     * @param collateralAsset The collateral asset to seize
     * @param debtAsset The debt asset to repay
     * @param debtAmount The amount of debt to repay
     */
    function executeLiquidation(
        address user,
        address collateralAsset,
        address debtAsset,
        uint256 debtAmount
    ) external nonReentrant onlyAuthorizedLiquidator {
        // Verify position can be liquidated
        (, uint256 healthFactor) = this.canLiquidate(user);
        if (healthFactor >= LIQUIDATION_THRESHOLD) revert PositionHealthy();

        // Verify liquidation amount is valid
        (, uint256 userDebt) = lendingPool.getUserAssetBalance(user, debtAsset);
        if (debtAmount == 0 || debtAmount > userDebt) revert InvalidLiquidationAmount();

        // Get liquidation config
        LiquidationConfig memory config = liquidationConfigs[debtAsset];
        if (!config.isActive) config = _getDefaultConfig();

        // Check close factor
        uint256 maxLiquidatableDebt = (userDebt * config.closeFactor) / PRECISION;
        if (debtAmount > maxLiquidatableDebt) revert InvalidLiquidationAmount();

        // Calculate collateral to seize
        (uint256 collateralPrice, ) = priceFeed.getSafePrice(collateralAsset);
        (uint256 debtPrice, ) = priceFeed.getSafePrice(debtAsset);

        require(collateralPrice > 0 && debtPrice > 0, "Invalid prices");

        uint256 collateralToSeize = (debtAmount * debtPrice * (PRECISION + config.liquidationBonus)) /
                                   (collateralPrice * PRECISION);

        // Verify sufficient collateral
        (uint256 userCollateral, ) = lendingPool.getUserAssetBalance(user, collateralAsset);
        if (collateralToSeize > userCollateral) revert InsufficientCollateral();

        // Execute liquidation via lending pool
        lendingPool.liquidate(user, collateralAsset, debtAsset, debtAmount);

        // Update statistics
        stats.totalLiquidations++;
        stats.totalValueLiquidated += debtAmount * debtPrice / PRECISION;
        stats.totalBonusPaid += (collateralToSeize * collateralPrice * config.liquidationBonus) /
                               (PRECISION * PRECISION);
        stats.assetLiquidationCount[debtAsset]++;
        stats.userLiquidationCount[user]++;

        emit LiquidationExecuted(
            msg.sender,
            user,
            collateralAsset,
            debtAsset,
            debtAmount,
            collateralToSeize,
            config.liquidationBonus
        );
    }

    /**
     * @dev Batch liquidation for multiple positions
     * @param users Array of users to liquidate
     * @param collateralAssets Array of collateral assets
     * @param debtAssets Array of debt assets
     * @param debtAmounts Array of debt amounts
     */
    function batchLiquidate(
        address[] calldata users,
        address[] calldata collateralAssets,
        address[] calldata debtAssets,
        uint256[] calldata debtAmounts
    ) external {
        require(
            users.length == collateralAssets.length &&
            users.length == debtAssets.length &&
            users.length == debtAmounts.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < users.length; i++) {
            try this.executeLiquidation(
                users[i],
                collateralAssets[i],
                debtAssets[i],
                debtAmounts[i]
            ) {} catch {
                // Continue with next liquidation if one fails
                continue;
            }
        }
    }

    /**
     * @dev Check multiple positions for liquidation opportunities
     * @param users Array of user addresses to check
     * @return liquidatable Array indicating which positions can be liquidated
     * @return healthFactors Array of health factors
     */
    function checkLiquidationOpportunities(address[] calldata users)
        external
        view
        returns (bool[] memory liquidatable, uint256[] memory healthFactors)
    {
        uint256 length = users.length;
        liquidatable = new bool[](length);
        healthFactors = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            (, , healthFactors[i], ) = lendingPool.getUserPosition(users[i]);
            liquidatable[i] = healthFactors[i] < LIQUIDATION_THRESHOLD && healthFactors[i] > 0;
        }
    }

    /**
     * @dev Monitor and emit events for unhealthy positions
     * @param users Array of user addresses to monitor
     */
    function monitorPositions(address[] calldata users) external {
        for (uint256 i = 0; i < users.length; i++) {
            (, , uint256 healthFactor, ) = lendingPool.getUserPosition(users[i]);

            if (healthFactor < LIQUIDATION_THRESHOLD && healthFactor > 0) {
                emit UnhealthyPositionDetected(users[i], healthFactor);

                if (healthFactor < 90e16) { // Critical threshold (0.9)
                    emit EmergencyLiquidation(users[i], healthFactor);
                }
            }
        }
    }

    /**
     * @dev Get liquidation statistics
     * @return totalLiquidations Total number of liquidations
     * @return totalValueLiquidated Total USD value liquidated
     * @return totalBonusPaid Total bonus paid to liquidators
     */
    function getLiquidationStats() external view returns (
        uint256 totalLiquidations,
        uint256 totalValueLiquidated,
        uint256 totalBonusPaid
    ) {
        return (
            stats.totalLiquidations,
            stats.totalValueLiquidated,
            stats.totalBonusPaid
        );
    }

    /**
     * @dev Get asset-specific liquidation count
     * @param asset The asset address
     * @return count Number of liquidations for this asset
     */
    function getAssetLiquidationCount(address asset) external view returns (uint256 count) {
        return stats.assetLiquidationCount[asset];
    }

    /**
     * @dev Get user-specific liquidation count
     * @param user The user address
     * @return count Number of times this user has been liquidated
     */
    function getUserLiquidationCount(address user) external view returns (uint256 count) {
        return stats.userLiquidationCount[user];
    }

    /**
     * @dev Set liquidator authorization
     * @param liquidator The liquidator address
     * @param authorized Whether the liquidator is authorized
     */
    function setLiquidatorAuthorization(address liquidator, bool authorized) external onlyOwner {
        authorizedLiquidators[liquidator] = authorized;
        emit LiquidatorAuthorized(liquidator, authorized);
    }

    /**
     * @dev Toggle liquidator whitelist
     * @param enabled Whether to enable the whitelist
     */
    function setWhitelistEnabled(bool enabled) external onlyOwner {
        liquidatorWhitelistEnabled = enabled;
        emit WhitelistToggled(enabled);
    }

    /**
     * @dev Emergency function to update lending pool address
     * @param newLendingPool The new lending pool address
     */
    function updateLendingPool(address newLendingPool) external onlyOwner {
        require(newLendingPool != address(0), "Invalid address");
        lendingPool = ILendingPool(newLendingPool);
    }

    /**
     * @dev Emergency function to update price feed address
     * @param newPriceFeed The new price feed address
     */
    function updatePriceFeed(address newPriceFeed) external onlyOwner {
        require(newPriceFeed != address(0), "Invalid address");
        priceFeed = ChainlinkPriceFeed(newPriceFeed);
    }

    // Internal functions

    function _getDefaultConfig() internal pure returns (LiquidationConfig memory) {
        return LiquidationConfig({
            liquidationThreshold: LIQUIDATION_THRESHOLD,
            liquidationBonus: LIQUIDATION_BONUS,
            closeFactor: MAX_LIQUIDATION_CLOSE_FACTOR,
            isActive: true
        });
    }
}
