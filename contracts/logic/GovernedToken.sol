// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../utils/Ownable.sol";

contract GovernedToken is Initializable, Ownable, ERC20Upgradeable, PausableUpgradeable {

    string public constant Version = "1";

    // 固定总量：2500万枚
    uint256 public constant TOTAL_SUPPLY = 25_000_000 * 10**18;

    // 黑名单映射
    mapping(address => bool) public blacklist;

    // 冻结地址映射
    mapping(address => bool) public frozenAddresses;

    // 事件
    event Issue(address indexed account, uint256 amount);
    event Redeem(address indexed account, uint256 amount);
    event AddedToBlacklist(address indexed account);
    event RemovedFromBlacklist(address indexed account);
    event AddressFrozen(address indexed account);
    event AddressUnfrozen(address indexed account);
    event ForcedTransfer(address indexed from, address indexed to, uint256 amount);

    // 修饰符：检查地址不在黑名单
    modifier notBlacklisted(address account) {
        require(!blacklist[account], "Address is blacklisted");
        _;
    }

    // 修饰符：检查地址未被冻结
    modifier notFrozen(address account) {
        require(!frozenAddresses[account], "Address is frozen");
        _;
    }

    function init() external initializer {
        __ERC20_init("Governed Token", "GOV");
        __Pausable_init();
        Ownable.initialize();
        // 铸造固定总量到发行人地址
        _mint(msg.sender, TOTAL_SUPPLY);
    }
    
    function decimals() public pure virtual override returns (uint8) {
        return 18;
    }

    function description() public pure returns (string memory) {
        return "ERC-20 Governed Token with Fixed Supply";
    }

    // ========== 铸造和销毁功能 ==========
    
    // 铸造代币（仅限owner）
    function mint(address account, uint256 amount) external onlyOwner notBlacklisted(account) {
        _mint(account, amount);
        emit Issue(account, amount);
    }

    // 销毁代币（仅限owner）
    function burn(address account, uint256 amount) external onlyOwner {
        require(balanceOf(account) >= amount, "Insufficient balance");
        _burn(account, amount);
        emit Redeem(account, amount);
    }

    // ========== 黑名单功能 ==========
    
    // 添加到黑名单
    function addToBlacklist(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        blacklist[account] = true;
        emit AddedToBlacklist(account);
    }

    // 从黑名单移除
    function removeFromBlacklist(address account) external onlyOwner {
        blacklist[account] = false;
        emit RemovedFromBlacklist(account);
    }

    // ========== 地址冻结功能 ==========
    
    // 冻结单个地址
    function freezeAddress(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        frozenAddresses[account] = true;
        emit AddressFrozen(account);
    }

    // 解冻单个地址
    function unfreezeAddress(address account) external onlyOwner {
        frozenAddresses[account] = false;
        emit AddressUnfrozen(account);
    }

    // ========== 全局暂停功能 ==========
    
    // 暂停所有转账
    function pause() external onlyOwner {
        _pause();
    }

    // 恢复所有转账
    function unpause() external onlyOwner {
        _unpause();
    }

    // ========== 应急操作：强制转移 ==========
    
    // 在受限条件下强制转移代币（应急操作）
    function forceTransfer(address from, address to, uint256 amount) external onlyOwner {
        require(from != address(0), "Invalid from address");
        require(to != address(0), "Invalid to address");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        _transfer(from, to, amount);
        emit ForcedTransfer(from, to, amount);
    }

    // ========== 转账功能（无手续费） ==========
    
    // 重写transfer，添加黑名单、冻结和暂停检查
    function transfer(address recipient, uint256 amount) 
        public 
        override 
        whenNotPaused 
        notBlacklisted(msg.sender) 
        notBlacklisted(recipient)
        notFrozen(msg.sender)
        notFrozen(recipient)
        returns (bool) 
    {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    // 重写transferFrom，添加黑名单、冻结和暂停检查
    function transferFrom(address sender, address recipient, uint256 amount) 
        public 
        override 
        whenNotPaused 
        notBlacklisted(sender) 
        notBlacklisted(recipient)
        notFrozen(sender)
        notFrozen(recipient)
        returns (bool) 
    {
        _transfer(sender, recipient, amount);
        
        uint256 currentAllowance = allowance(sender, msg.sender);
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, msg.sender, currentAllowance - amount);
        }
        
        return true;
    }

    // ========== 查询功能 ==========
    
    // 检查地址是否在黑名单
    function isBlacklisted(address account) external view returns (bool) {
        return blacklist[account];
    }

    // 检查地址是否被冻结
    function isFrozen(address account) external view returns (bool) {
        return frozenAddresses[account];
    }
}
