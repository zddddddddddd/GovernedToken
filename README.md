# GovernedToken - 可治理的 ERC20 代币合约

一个功能完善的 ERC20 代币智能合约，具有治理功能、黑名单管理、地址冻结、全局暂停和可升级特性。

## 特性

### 核心功能
- ✅ **ERC20 标准**: 完全兼容 ERC20 代币标准
- ✅ **固定总量**: 初始铸造 25,000,000 GOV 代币
- ✅ **18 位小数**: 标准的代币精度
- ✅ **可升级**: 通过代理模式实现合约升级
- ✅ **无手续费**: 转账不收取任何手续费

### 治理功能
- 🔐 **所有权管理**: 基于 Ownable 模式的权限控制
- 🪙 **铸造代币**: 所有者可以铸造新代币
- 🔥 **销毁代币**: 所有者可以销毁任意地址的代币
- 🚫 **黑名单管理**: 禁止特定地址进行转账
- ❄️ **地址冻结**: 冻结特定地址的转账功能
- ⏸️ **全局暂停**: 暂停所有转账操作
- 🚨 **强制转移**: 应急情况下强制转移代币

## 技术栈

- Solidity ^0.8.13
- Hardhat 3.0
- OpenZeppelin Contracts Upgradeable 5.4.0
- TypeScript
- Ethers.js v6

## 合约架构

```
GovernedToken (可升级实现合约)
    ├── Initializable (OpenZeppelin)
    ├── Ownable (自定义所有权管理)
    ├── ERC20Upgradeable (OpenZeppelin)
    └── PausableUpgradeable (OpenZeppelin)

Proxy (代理合约)
    └── 委托调用到 GovernedToken
```

## 合约功能详解

### 1. 初始化

```solidity
function init() external
```
- 初始化代币名称为 "Governed Token"，符号为 "GOV"
- 铸造 25,000,000 GOV 到部署者地址
- 只能调用一次

### 2. 铸造功能

```solidity
function mint(address account, uint256 amount) external onlyOwner
```
- 仅所有者可调用
- 向指定地址铸造新代币
- 不能向黑名单地址铸造
- 触发 `Issue` 事件

### 3. 销毁功能

```solidity
function burn(address account, uint256 amount) external onlyOwner
```
- 仅所有者可调用
- 销毁指定地址的代币
- 需要目标地址有足够余额
- 触发 `Redeem` 事件

### 4. 黑名单管理

```solidity
function addToBlacklist(address account) external onlyOwner
function removeFromBlacklist(address account) external onlyOwner
function isBlacklisted(address account) external view returns (bool)
```
- 黑名单地址无法进行任何转账（发送或接收）
- 无法向黑名单地址铸造代币
- 触发 `AddedToBlacklist` 或 `RemovedFromBlacklist` 事件

### 5. 地址冻结

```solidity
function freezeAddress(address account) external onlyOwner
function unfreezeAddress(address account) external onlyOwner
function isFrozen(address account) external view returns (bool)
```
- 冻结的地址无法进行转账（发送或接收）
- 与黑名单类似，但语义不同
- 触发 `AddressFrozen` 或 `AddressUnfrozen` 事件

### 6. 全局暂停

```solidity
function pause() external onlyOwner
function unpause() external onlyOwner
```
- 暂停后，所有转账操作都会失败
- 用于应急情况
- 不影响查询功能

### 7. 强制转移

```solidity
function forceTransfer(address from, address to, uint256 amount) external onlyOwner
```
- 仅所有者可调用
- 可以绕过冻结和黑名单限制
- 用于应急情况下的资产恢复
- 触发 `ForcedTransfer` 事件

### 8. 标准转账

```solidity
function transfer(address recipient, uint256 amount) public returns (bool)
function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)
```
- 标准 ERC20 转账功能
- 会检查：暂停状态、黑名单、冻结状态
- 无手续费

### 9. 查询功能

```solidity
function balanceOf(address account) public view returns (uint256)
function totalSupply() public view returns (uint256)
function allowance(address owner, address spender) public view returns (uint256)
function name() public view returns (string memory)
function symbol() public view returns (string memory)
function decimals() public view returns (uint8)
function description() public pure returns (string memory)
```

## 重要提示

### 关于代币数量和小数位

代币有 **18 位小数**，在合约交互时需要特别注意：

| 想要的代币数量 | 需要输入的值（Wei 单位） |
|--------------|----------------------|
| 1 个代币 | 1000000000000000000 |
| 10 个代币 | 10000000000000000000 |
| 100 个代币 | 100000000000000000000 |
| 1,000 个代币 | 1000000000000000000000 |
| 10,000 个代币 | 10000000000000000000000 |
| 100,000 个代币 | 100000000000000000000000 |

**计算公式**: `实际输入值 = 代币数量 × 10^18`

**在线转换工具**: https://eth-converter.com/

### 示例

如果要转账 100 个代币：
```javascript
// JavaScript/TypeScript
const amount = ethers.parseEther("100"); // 100000000000000000000

// Solidity
uint256 amount = 100 * 10**18;
```

## 事件

```solidity
event Issue(address indexed account, uint256 amount);
event Redeem(address indexed account, uint256 amount);
event AddedToBlacklist(address indexed account);
event RemovedFromBlacklist(address indexed account);
event AddressFrozen(address indexed account);
event AddressUnfrozen(address indexed account);
event ForcedTransfer(address indexed from, address indexed to, uint256 amount);
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
```

## 安全特性

1. **权限控制**: 所有管理功能都需要所有者权限
2. **可暂停**: 发现问题时可以立即暂停所有转账
3. **黑名单**: 可以禁止恶意地址参与
4. **地址冻结**: 可以临时冻结可疑地址
5. **可升级**: 通过代理模式可以修复漏洞或添加新功能
6. **事件记录**: 所有重要操作都会触发事件，便于追踪

## 测试

项目包含完整的测试套件，覆盖所有功能：

```bash
npm test
```

测试包括：
- ✅ 部署和初始化（7 个测试）
- ✅ 铸造功能（3 个测试）
- ✅ 销毁功能（2 个测试）
- ✅ 转账功能（3 个测试）
- ✅ 黑名单功能（3 个测试）
- ✅ 地址冻结功能（3 个测试）
- ✅ 全局暂停功能（3 个测试）
- ✅ 强制转移功能（3 个测试）
- ✅ 所有权管理（3 个测试）
- ✅ Ownable 合约（13 个测试）
- ✅ Proxy 合约（13 个测试）

总计：**62 个测试**

## 配置

### 环境变量

创建 `.env` 文件：

```env
# Sepolia 测试网 RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# 部署账户私钥（不要包含 0x 前缀）
SEPOLIA_PRIVATE_KEY=your_private_key_here

# Etherscan API Key（用于合约验证）
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### Hardhat 配置

配置文件位于 `hardhat.config.ts`，包含：
- Solidity 编译器版本：0.8.28
- 网络配置：Sepolia、Mainnet
- Etherscan 验证配置

## 项目结构

```
GovernedToken/
├── contracts/
│   ├── logic/
│   │   └── GovernedToken.sol      # 主合约
│   ├── proxy/
│   │   └── Proxy.sol               # 代理合约
│   └── utils/
│       └── Ownable.sol             # 所有权管理
├── ignition/
│   └── modules/
│       └── GovernedTokenModule.ts  # 部署模块
├── scripts/
│   └── generate-verification-files.ts  # 生成验证文件
├── test/
│   ├── GovernedToken.test.ts       # 主合约测试
│   ├── Ownable.test.ts             # Ownable 测试
│   └── Proxy.test.ts               # Proxy 测试
├── hardhat.config.ts               # Hardhat 配置
├── package.json                    # 项目配置
└── README.md                       # 本文档
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过 GitHub Issues 联系。

---

**警告**: 本合约仅供学习和参考使用。在生产环境使用前，请务必进行完整的安全审计。
