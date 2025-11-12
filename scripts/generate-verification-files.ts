import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("\n📝 正在生成验证文件...\n");

  try {
    // 读取最新的部署信息
    const deploymentsDir = path.join(__dirname, "../ignition/deployments");
    const chainDirs = fs.readdirSync(deploymentsDir).filter(f => f.startsWith("chain-"));
    
    if (chainDirs.length === 0) {
      throw new Error("未找到部署信息，请先部署合约");
    }

    // 获取最新的部署目录
    const latestChainDir = chainDirs.sort((a, b) => {
      const aTime = fs.statSync(path.join(deploymentsDir, a)).mtime.getTime();
      const bTime = fs.statSync(path.join(deploymentsDir, b)).mtime.getTime();
      return bTime - aTime;
    })[0];

    const deploymentPath = path.join(deploymentsDir, latestChainDir, "deployed_addresses.json");
    
    if (!fs.existsSync(deploymentPath)) {
      throw new Error("未找到部署地址文件");
    }

    const deployedAddresses = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const governedTokenAddress = deployedAddresses["GovernedTokenModule#GovernedToken"];
    const proxyAddress = deployedAddresses["GovernedTokenModule#Proxy"];

    console.log("✅ 找到部署地址:");
    console.log("   GovernedToken:", governedTokenAddress);
    console.log("   Proxy:", proxyAddress);
    console.log();

    // 查找最新的 build-info 文件
    const buildInfoDir = path.join(__dirname, "../artifacts/build-info");
    const files = fs.readdirSync(buildInfoDir)
      .filter(f => f.endsWith(".json") && !f.endsWith(".output.json"))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(buildInfoDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      throw new Error("未找到编译信息文件，请先编译合约");
    }

    const latestBuildInfo = files[0].name;
    const buildInfoPath = path.join(buildInfoDir, latestBuildInfo);
    const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, "utf8"));

    // 生成 Standard JSON Input
    const standardInput = JSON.stringify(buildInfo.input, null, 2);
    const outputPath = path.join(__dirname, "../standard-input-GovernedToken.json");
    fs.writeFileSync(outputPath, standardInput);

    console.log("✅ 验证文件已生成: standard-input-GovernedToken.json");
    console.log(`   文件大小: ${(standardInput.length / 1024).toFixed(2)} KB\n`);

    // 获取网络信息
    const chainId = latestChainDir.replace("chain-", "");
    let networkName = "sepolia";
    let explorerUrl = "sepolia.etherscan.io";
    
    if (chainId === "1") {
      networkName = "mainnet";
      explorerUrl = "etherscan.io";
    } else if (chainId === "11155111") {
      networkName = "sepolia";
      explorerUrl = "sepolia.etherscan.io";
    }

    // 生成部署信息文档
    const guide = `# GovernedToken 合约部署信息

## 部署详情
- **生成时间**: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
- **网络**: ${networkName} (Chain ID: ${chainId})
- **GovernedToken 实现合约**: \`${governedTokenAddress}\`
- **Proxy 代理合约**: \`${proxyAddress}\`
- **代理后的 Token 地址**: \`${proxyAddress}\`

## 合约配置
- **编译器版本**: v0.8.28+commit.7893614a
- **开源许可**: MIT License (3)
- **优化**: Disabled (默认配置)
- **代币名称**: Governed Token
- **代币符号**: GOV
- **小数位数**: 18
- **固定总量**: 25,000,000 GOV

## Etherscan 验证步骤

### 方法一：使用 Hardhat 自动验证（推荐）

\`\`\`bash
npx hardhat verify --network ${networkName} ${governedTokenAddress}
\`\`\`

### 方法二：手动验证（Standard JSON Input）

1. **访问验证页面**
   https://${explorerUrl}/verifyContract-solc?a=${governedTokenAddress}

2. **选择验证方式**
   - Compiler Type: \`Solidity (Standard-Json-Input)\`
   - Compiler Version: \`v0.8.28+commit.7893614a\`
   - Open Source License Type: \`3) MIT License (MIT)\`

3. **点击 "Continue"**

4. **上传 JSON 文件**
   - 点击 "Choose File" 按钮
   - 上传项目根目录下的 \`standard-input-GovernedToken.json\` 文件
   - Constructor Arguments: 留空（本合约无构造函数参数）

5. **完成验证**
   - 勾选 "I'm not a robot"
   - 点击 "Verify and Publish"
   - 等待验证完成

## 验证文件

已自动生成验证所需的文件：
- \`standard-input-GovernedToken.json\` - 标准 JSON 输入文件

这个文件包含了所有依赖的合约源代码和编译设置，是最可靠的验证方式。

## 代币使用说明

### 重要：关于代币数量和小数位

代币有 **18 位小数**，在合约交互时需要注意：

| 想要的代币数量 | 需要输入的值（Wei 单位） |
|--------------|----------------------|
| 1 个代币 | 1000000000000000000 |
| 10 个代币 | 10000000000000000000 |
| 100 个代币 | 100000000000000000000 |
| 1,000 个代币 | 1000000000000000000000 |
| 10,000 个代币 | 10000000000000000000000 |
| 100,000 个代币 | 100000000000000000000000 |

**计算公式**: 实际输入值 = 代币数量 × 10^18

**在线转换工具**: https://eth-converter.com/

### 主要功能

- ✅ **铸造代币** (mint): 仅所有者可以铸造新代币
- ✅ **销毁代币** (burn): 仅所有者可以销毁代币
- ✅ **黑名单管理**: 所有者可以添加/移除黑名单地址
- ✅ **地址冻结**: 所有者可以冻结/解冻特定地址
- ✅ **全局暂停**: 所有者可以暂停/恢复所有转账
- ✅ **强制转移** (forceTransfer): 所有者可以强制转移代币（应急功能）
- ✅ **可升级**: 通过代理合约实现可升级功能

## 区块链浏览器链接

- **GovernedToken 合约**: https://${explorerUrl}/address/${governedTokenAddress}
- **Proxy 合约**: https://${explorerUrl}/address/${proxyAddress}

## 快速命令

\`\`\`bash
# 重新生成验证文件
npm run generate-verification

# 验证合约
npx hardhat verify --network ${networkName} ${governedTokenAddress}

# 运行测试
npm test

# 重新编译
npm run compile
\`\`\`
`;

    const guidePath = path.join(__dirname, "../DEPLOYMENT_INFO.md");
    fs.writeFileSync(guidePath, guide);

    console.log("✅ 部署信息已生成: DEPLOYMENT_INFO.md\n");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 验证文件准备完成！");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📋 下一步操作：");
    console.log("   1. 查看 DEPLOYMENT_INFO.md 了解部署详情");
    console.log("   2. 使用 standard-input-GovernedToken.json 在 Etherscan 上验证合约");
    console.log(`   3. 或运行: npx hardhat verify --network ${networkName} ${governedTokenAddress}\n`);

  } catch (error: any) {
    console.error("❌ 生成验证文件时出错:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
