// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "../utils/Ownable.sol";

contract GovernedToken is Ownable, ERC20Upgradeable {

    string public constant Version = "0";

    // Called when new token are issued
    event Issue(address indexed addr1, uint256 amount);

    // Called when tokens are redeemed
    event Redeem(address indexed addr1,uint256 amount);

    function init() external {
        initialize();
    }

    function symbol() public pure override returns (string memory) {
        return "Governed";
    }

    function name() public pure override returns (string memory) {
        return "Sure AM Shares";
    }

    function description() public pure returns (string memory) {
        return "Sure Asset Management Shares Tokenization Contract";
    }
    
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    // Issue tokens
    // @param account owner of token to be issued
    // @param amount Number of tokens to be issued
    function issue(address account, uint256 amount) external onlyOwner  {
        _mint(account, amount);
        emit Issue(account,amount);
    }

    // Redeem tokens.
    // @param account owner of token to be redeemed   
    // @param amount Number of tokens to be redeemed
    function redeem(address account ,uint256 amount) external onlyOwner{
        require(balanceOf(account) >= amount,"Insufficient token");
        _burn(account, amount);
        emit Redeem(account,amount);
    }

    // Override the transfer method of ERC20.
    function transfer(address /* recipient */, uint256 /* amount */) public pure override returns (bool) {
        revert("unsupported");  
    }

    // Override the transferFrom method of ERC20.
    function transferFrom(address /* sender */, address /* recipient */, uint256 /* amount */) public pure override returns (bool) {
        revert("unsupported");   
    }
}
