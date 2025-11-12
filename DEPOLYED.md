### 环境
node v22.21.1
npm 10.9.4


### 安装依赖

```bash
npm install
```

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

### 第 2 步：编译

```bash
npx hardhat compile
```

### 第 3 步：测试

```bash
npx hardhat test
```

### 第 4 步：部署合约

**使用代理模式（推荐）：**
```bash
npx hardhat ignition deploy ignition/modules/GovernedTokenModule.ts --network sepolia
```

### 第 5 步：验证合约（可选）

```bash
npx hardhat verify --network sepolia <合约地址>
```

### 如果验证不成功
则手动进行验证，生成验证文件，手动上传
```bash
npm run generate-verification
```

## 📖 相关文档

- **项目说明**: [README.md](./README.md)

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