// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Simple mintable/burnable ERC20 for cross-chain representational asset
contract SyntheticAsset is ERC20, AccessControl {
    address public pool;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        pool = msg.sender;
    }

    modifier onlyPool() {
        require(msg.sender == pool, "Only LendingPool");
        _;
    }

    function mint(address to, uint256 amount) external onlyPool {
        _mint(to, amount);
    }
    function burn(address from, uint256 amount) external onlyPool {
        _burn(from, amount);
    }
    function setPool(address newPool) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "No admin");
        pool = newPool;
    }
}
