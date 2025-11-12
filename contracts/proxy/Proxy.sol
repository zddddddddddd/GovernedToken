// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Proxy {
    address public owner;
    address public implementation;

    event ProxyTargetSet(address indexed previousTarget, address indexed newTarget);
    event ProxyOwnerChanged(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function target() public view returns (address) {
        return implementation;
    }

    /**
     * @dev 设置新的实现合约地址（用于升级）
     */
    function setTarget(address _target) public onlyOwner {
        require(_target != address(0), "Invalid target address");
        require(_target != implementation, "Same implementation");
        
        address previousTarget = implementation;
        implementation = _target;
        emit ProxyTargetSet(previousTarget, _target);
    }

    /**
     * @dev 转移代理合约所有权
     */
    function setOwner(address _owner) public onlyOwner {
        require(_owner != address(0), "Invalid owner address");
        require(_owner != owner, "Same owner");
        
        address previousOwner = owner;
        owner = _owner;
        emit ProxyOwnerChanged(previousOwner, _owner);
    }

    /**
     * @dev 接收 ETH（如果需要）
     */
    receive() external payable {}

    /**
     * @dev 回退函数 - 将所有调用委托给实现合约
     */
    fallback() external payable {
        address _impl = implementation;
        require(_impl != address(0), "Target not set");

        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())
            let result := delegatecall(gas(), _impl, ptr, calldatasize(), 0, 0)
            let size := returndatasize()
            returndatacopy(ptr, 0, size)

            switch result
            case 0 {
                revert(ptr, size)
            }
            default {
                return(ptr, size)
            }
        }
    }
}