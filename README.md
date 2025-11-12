# GovernedToken - 资产管理份额代币合约

一个基于 ERC20 的中心化管理代币合约，专门用于资产管理份额的代币化。

## 📋 合约信息

- **合约名称**: GovernedToken
- **代币名称**: Sure AM Shares
- **代币符号**: Governed
- **小数位数**: 0（不可分割）
- **版本**: 0
- **描述**: Sure Asset Management Shares Tokenization Contract

## ✨ 核心功能

### 1. 代币发行（Issue）
- **功能**: 所有者可以给任何地址发行代币
- **权限**: 仅所有者
- **用途**: 投资者购买份额、新用户加入
- **示例**: `issue("0x地址", 100)` - 发行 100 个份额

### 2. 代币赎回（Redeem）
- **功能**: 所有者可以从任何地址赎回（销毁）代币
- **权限**: 仅所有者
- **用途**: 投资者退出、赎回份额
- **示例**: `redeem("0x地址", 50)` - 赎回 50 个份额

### 3. 转账禁用
- **特点**: 完全禁止用户之间转账
- **原因**: 确保合规，防止私下交易
- **适用**: 证券型代币、受监管资产

### 4. 不可分割
- **小数位**: 0
- **意义**: 只能持有整数个代币（1、2、3...）
- **优势**: 避免小数计算误差，份额清晰

### 5. 所有权管理
- 查询合约所有者
- 转移所有权
- 权限控制

## 🎯 适用场景

### ✅ 适合
- 资产管理份额（基金、信托）
- 证券型代币（Security Token）
- 会员权益代币
- 受监管的数字资产

### ❌ 不适合
- 去中心化代币
- 自由交易的代币
- 支付代币
- DEX 交易

## 🔧 可用方法

### 只读方法（免费查询）

- `name()` - 获取代币名称
- `symbol()` - 获取代币符号
- `decimals()` - 获取小数位数
- `totalSupply()` - 获取总供应量
- `balanceOf(address)` - 查询地址余额
- `contractOwner()` - 获取合约所有者
- `isOwner()` - 检查是否为所有者
- `Version()` - 获取合约版本
- `description()` - 获取合约描述

### 写入方法（需要 Gas 和权限）

**仅所有者可调用：**
- `issue(address account, uint256 amount)` - 发行代币
- `redeem(address account, uint256 amount)` - 赎回代币
- `transferOwnership(address newOwner)` - 转移所有权

**已禁用：**
- `transfer()` - 转账功能已禁用
- `transferFrom()` - 转账功能已禁用

## 🔐 安全特性

1. **所有权控制** - 只有所有者可以发行和赎回
2. **转账限制** - 禁止用户间转账，确保合规
3. **不可分割性** - 0 小数位确保份额完整性
4. **事件记录** - 所有操作都有事件日志，可追溯
5. **可升级性** - 通过代理模式部署，支持升级

## 💻 使用示例

### 查看合约信息
```bash
npx hardhat run scripts/quick-interact.ts --network sepolia
```

### 发行代币
```bash
# 编辑 scripts/issue-tokens.ts 修改接收地址和数量
npx hardhat run scripts/issue-tokens.ts --network sepolia
```

### 使用 Hardhat Console
```bash
npx hardhat console --network sepolia
```

在控制台中：
```javascript
const connection = await network.connect();
const { ethers } = connection;
const token = await ethers.getContractAt("GovernedToken", "代理合约地址");

// 发行代币
await token.issue("0x地址", 100);

// 查询余额
await token.balanceOf("0x地址");

// 赎回代币
await token.redeem("0x地址", 50);
```

## 📊 与标准 ERC20 的区别

| 功能 | 标准 ERC20 | GovernedToken |
|------|-----------|---------------|
| 发行代币 | 构造函数一次性发行 | 所有者可随时发行 |
| 销毁代币 | 用户可自行销毁 | 只有所有者可赎回 |
| 转账 | ✅ 自由转账 | ❌ 完全禁用 |
| 小数位 | 通常 18 位 | 0 位（不可分割）|
| 去中心化 | ✅ 完全去中心化 | ❌ 中心化管理 |

## 🏗️ 项目结构

```
.
├── contracts/           # 智能合约
│   ├── logic/          # GovernedToken 业务逻辑
│   ├── proxy/          # Proxy 代理合约
│   └── utils/          # Ownable 工具合约
├── test/               # 测试文件（53 个测试用例）
├── scripts/            # 部署和交互脚本
└── types/              # TypeScript 类型定义
```

## 🧪 测试

```bash
# 运行所有测试
npx hardhat test

# 运行特定测试
npx hardhat test test/GovernedToken.test.ts
```

**测试覆盖**：
- GovernedToken: 23 个测试
- Ownable: 14 个测试
- Proxy: 16 个测试
- **总计**: 53 个测试全部通过 ✅

## 📦 技术栈

- Solidity ^0.8.13
- Hardhat 3.x
- ethers.js v6
- TypeScript
- OpenZeppelin Contracts Upgradeable
- Mocha + Chai

## ⚠️ 注意事项

1. **中心化风险** - 所有权限集中在所有者手中
2. **流动性限制** - 用户不能自由交易
3. **所有者责任** - 需要妥善保管私钥
4. **不可逆操作** - 发行和赎回操作不可撤销
5. **升级风险** - 合约升级需要谨慎测试

## 📄 许可证

MIT License

## 📚 相关文档

- [部署指南](./scripts/SETUP_COMPLETE.md) - 完整的部署和配置说明
