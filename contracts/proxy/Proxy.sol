// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Proxy {
    address public owner;
    address public implementation;

    event ProxyTargetSet(address target);
    event ProxyOwnerChanged(address owner);

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

    function setTarget(address _target) public onlyOwner {
        implementation = _target;
        emit ProxyTargetSet(_target);
    }

    function setOwner(address _owner) public onlyOwner {
        owner = _owner;
        emit ProxyOwnerChanged(_owner);
    }

    fallback() external {
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