### 第 1 步：配置环境变量

```bash
# 复制模板
cp .env.example .env

# 编辑 .env 文件
nano .env
```

填入以下内容：
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
SEPOLIA_PRIVATE_KEY=你的私钥（不要0x前缀）
ETHERSCAN_API_KEY=你的Etherscan_API密钥（可选）
```

### 第 2 步：获取测试 ETH

访问水龙头：
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### 第 3 步：检查余额

```bash
npx hardhat run scripts/check-balance.ts --network sepolia
```

### 第 4 步：部署合约

**使用代理模式（推荐）：**
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### 第 5 步：验证合约（可选）

```bash
npx hardhat verify --network sepolia <合约地址>
```

## 📖 相关文档

- **项目说明**: [README.md](../README.md)

## 🎯 下一步

1. 配置 `.env` 文件
2. 获取测试 ETH
3. 运行部署脚本
4. 保存合约地址
5. 验证合约（可选）

## 💡 提示

- 使用 `--network sepolia` 参数指定 Sepolia 测试网
- 不指定网络参数时，默认使用本地 Hardhat 网络
- 部署后记得保存合约地址
- 可以在 https://sepolia.etherscan.io/ 查看你的合约

## ⚠️ 重要提醒

- ✅ `.env` 文件已在 `.gitignore` 中
- ❌ 永远不要提交私钥到 Git
- ✅ 先在测试网充分测试
- ❌ 不要在公共场合展示私钥

---

**准备好了吗？开始部署吧！** 🚀
