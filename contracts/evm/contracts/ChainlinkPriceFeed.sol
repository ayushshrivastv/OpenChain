// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ChainlinkPriceFeed is Ownable {

    // Maximum allowed staleness for price data (24 hours)
    uint256 public constant MAX_STALENESS = 24 hours;

    // Price feed configuration
    struct PriceFeedConfig {
        AggregatorV3Interface feed;
        uint8 decimals;
        uint256 heartbeat; // Maximum expected time between price updates
        bool isActive;
        string description;
    }

    // Asset address => Price feed configuration
    mapping(address => PriceFeedConfig) public priceFeeds;

    // Fallback prices for emergency situations (set by owner)
    mapping(address => uint256) public fallbackPrices;
    mapping(address => uint256) public fallbackTimestamps;

    // Events
    event PriceFeedAdded(address indexed asset, address indexed feed, string description);
    event PriceFeedUpdated(address indexed asset, address indexed oldFeed, address indexed newFeed);
    event PriceFeedRemoved(address indexed asset);
    event FallbackPriceSet(address indexed asset, uint256 price, uint256 timestamp);
    event StalePriceDetected(address indexed asset, uint256 lastUpdate, uint256 staleness);

    // Errors
    error PriceFeedNotFound();
    error StalePriceData();
    error InvalidPriceData();
    error PriceFeedInactive();

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Add a new price feed for an asset
     * @param asset The asset token address
     * @param feed The Chainlink price feed address
     * @param heartbeat Maximum expected time between updates
     * @param description Human readable description
     */
    function addPriceFeed(
        address asset,
        address feed,
        uint256 heartbeat,
        string calldata description
    ) external onlyOwner {
        require(asset != address(0) && feed != address(0), "Invalid addresses");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed);

        // Verify the feed works by calling it
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price feed");
        require(updatedAt > 0, "Invalid timestamp");

        priceFeeds[asset] = PriceFeedConfig({
            feed: priceFeed,
            decimals: priceFeed.decimals(),
            heartbeat: heartbeat,
            isActive: true,
            description: description
        });

        emit PriceFeedAdded(asset, feed, description);
    }

    /**
     * @dev Update existing price feed
     * @param asset The asset token address
     * @param newFeed The new price feed address
     * @param heartbeat New heartbeat value
     */
    function updatePriceFeed(
        address asset,
        address newFeed,
        uint256 heartbeat
    ) external onlyOwner {
        require(priceFeeds[asset].isActive, "Price feed not found");

        address oldFeed = address(priceFeeds[asset].feed);
        AggregatorV3Interface priceFeed = AggregatorV3Interface(newFeed);

        // Verify the new feed works
        (, int256 price, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price feed");
        require(updatedAt > 0, "Invalid timestamp");

        priceFeeds[asset].feed = priceFeed;
        priceFeeds[asset].decimals = priceFeed.decimals();
        priceFeeds[asset].heartbeat = heartbeat;

        emit PriceFeedUpdated(asset, oldFeed, newFeed);
    }

    /**
     * @dev Remove a price feed
     * @param asset The asset token address
     */
    function removePriceFeed(address asset) external onlyOwner {
        require(priceFeeds[asset].isActive, "Price feed not found");

        delete priceFeeds[asset];

        emit PriceFeedRemoved(asset);
    }

    /**
     * @dev Set fallback price for emergency situations
     * @param asset The asset token address
     * @param price The fallback price (in 18 decimals)
     */
    function setFallbackPrice(address asset, uint256 price) external onlyOwner {
        require(price > 0, "Invalid price");

        fallbackPrices[asset] = price;
        fallbackTimestamps[asset] = block.timestamp;

        emit FallbackPriceSet(asset, price, block.timestamp);
    }

    /**
     * @dev Get price for an asset with comprehensive checks
     * @param asset The asset token address
     * @return price The asset price (normalized to 18 decimals)
     * @return decimals The price decimals (always 18)
     */
    function getPrice(address asset) external view returns (int256 price, uint8 decimals) {
        PriceFeedConfig memory config = priceFeeds[asset];

        if (!config.isActive) revert PriceFeedNotFound();

        try config.feed.latestRoundData() returns (
            uint80 /* roundId */,
            int256 rawPrice,
            uint256 /* startedAt */,
            uint256 updatedAt,
            uint80 /* answeredInRound */
        ) {
            // Check if price is valid
            if (rawPrice <= 0) revert InvalidPriceData();

            // Check staleness
            uint256 staleness = block.timestamp - updatedAt;
            if (staleness > config.heartbeat || staleness > MAX_STALENESS) {
                // Use fallback price if available and not too old
                if (fallbackPrices[asset] > 0 &&
                    (block.timestamp - fallbackTimestamps[asset]) < MAX_STALENESS) {
                    return (int256(fallbackPrices[asset]), 18);
                }

                revert StalePriceData();
            }

            // Normalize price to 18 decimals
            if (config.decimals < 18) {
                price = rawPrice * int256(10 ** (18 - config.decimals));
            } else if (config.decimals > 18) {
                price = rawPrice / int256(10 ** (config.decimals - 18));
            } else {
                price = rawPrice;
            }

            return (price, 18);

        } catch {
            // If price feed fails, try fallback price
            if (fallbackPrices[asset] > 0 &&
                (block.timestamp - fallbackTimestamps[asset]) < MAX_STALENESS) {
                return (int256(fallbackPrices[asset]), 18);
            }

            revert InvalidPriceData();
        }
    }

    /**
     * @dev Get price and emit staleness event if needed (non-view function)
     * @param asset The asset token address
     * @return price The asset price (normalized to 18 decimals)
     * @return decimals The price decimals (always 18)
     */
    function getPriceWithEvents(address asset) external returns (int256 price, uint8 decimals) {
        PriceFeedConfig memory config = priceFeeds[asset];

        if (!config.isActive) revert PriceFeedNotFound();

        try config.feed.latestRoundData() returns (
            uint80,
            int256 rawPrice,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            // Check if price is valid
            if (rawPrice <= 0) revert InvalidPriceData();

            // Check staleness and emit event
            uint256 staleness = block.timestamp - updatedAt;
            if (staleness > config.heartbeat || staleness > MAX_STALENESS) {
                emit StalePriceDetected(asset, updatedAt, staleness);

                // Use fallback price if available and not too old
                if (fallbackPrices[asset] > 0 &&
                    (block.timestamp - fallbackTimestamps[asset]) < MAX_STALENESS) {
                    return (int256(fallbackPrices[asset]), 18);
                }

                revert StalePriceData();
            }

            // Normalize price to 18 decimals
            if (config.decimals < 18) {
                price = rawPrice * int256(10 ** (18 - config.decimals));
            } else if (config.decimals > 18) {
                price = rawPrice / int256(10 ** (config.decimals - 18));
            } else {
                price = rawPrice;
            }

            return (price, 18);

        } catch {
            // If price feed fails, try fallback price
            if (fallbackPrices[asset] > 0 &&
                (block.timestamp - fallbackTimestamps[asset]) < MAX_STALENESS) {
                return (int256(fallbackPrices[asset]), 18);
            }

            revert InvalidPriceData();
        }
    }

    /**
     * @dev Get safe price with automatic fallback
     * @param asset The asset token address
     * @return price The asset price (normalized to 18 decimals)
     * @return isStale Whether the price data is considered stale
     */
    function getSafePrice(address asset) external view returns (uint256 price, bool isStale) {
        PriceFeedConfig memory config = priceFeeds[asset];

        if (!config.isActive) return (0, true);

        try config.feed.latestRoundData() returns (
            uint80,
            int256 rawPrice,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            if (rawPrice <= 0) return (0, true);

            // Check staleness
            uint256 staleness = block.timestamp - updatedAt;
            isStale = staleness > config.heartbeat || staleness > MAX_STALENESS;

            if (isStale) {
                // Try fallback price
                if (fallbackPrices[asset] > 0 &&
                    (block.timestamp - fallbackTimestamps[asset]) < MAX_STALENESS) {
                    return (fallbackPrices[asset], false);
                }
                return (0, true);
            }

            // Normalize price to 18 decimals
            if (config.decimals < 18) {
                price = uint256(rawPrice) * 10 ** (18 - config.decimals);
            } else if (config.decimals > 18) {
                price = uint256(rawPrice) / 10 ** (config.decimals - 18);
            } else {
                price = uint256(rawPrice);
            }

            return (price, false);

        } catch {
            // Try fallback price
            if (fallbackPrices[asset] > 0 &&
                (block.timestamp - fallbackTimestamps[asset]) < MAX_STALENESS) {
                return (fallbackPrices[asset], false);
            }

            return (0, true);
        }
    }

    /**
     * @dev Get multiple asset prices in one call
     * @param assets Array of asset addresses
     * @return prices Array of normalized prices (18 decimals)
     * @return isStale Array indicating if each price is stale
     */
    function getPrices(address[] calldata assets)
        external
        view
        returns (uint256[] memory prices, bool[] memory isStale)
    {
        uint256 length = assets.length;
        prices = new uint256[](length);
        isStale = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            (prices[i], isStale[i]) = this.getSafePrice(assets[i]);
        }
    }

    /**
     * @dev Check if a price feed exists and is active
     * @param asset The asset token address
     * @return exists Whether the price feed exists and is active
     */
    function hasPriceFeed(address asset) external view returns (bool exists) {
        return priceFeeds[asset].isActive;
    }

    /**
     * @dev Get price feed configuration
     * @param asset The asset token address
     * @return feed The price feed address
     * @return decimals The feed decimals
     * @return heartbeat The maximum expected update frequency
     * @return isActive Whether the feed is active
     * @return description The feed description
     */
    function getPriceFeedConfig(address asset) external view returns (
        address feed,
        uint8 decimals,
        uint256 heartbeat,
        bool isActive,
        string memory description
    ) {
        PriceFeedConfig memory config = priceFeeds[asset];
        return (
            address(config.feed),
            config.decimals,
            config.heartbeat,
            config.isActive,
            config.description
        );
    }

    /**
     * @dev Emergency function to toggle price feed active status
     * @param asset The asset token address
     * @param active New active status
     */
    function setPriceFeedActive(address asset, bool active) external onlyOwner {
        require(address(priceFeeds[asset].feed) != address(0), "Price feed not found");
        priceFeeds[asset].isActive = active;
    }
}
