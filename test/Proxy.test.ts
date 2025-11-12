import { expect } from "chai";
import { network } from "hardhat";
import type { Proxy } from "../types/ethers-contracts/proxy/Proxy.js";
import type { GovernedToken } from "../types/ethers-contracts/logic/SureSharesToken.sol/GovernedToken.js";

describe("Proxy", function () {
  let proxy: Proxy;
  let implementation: GovernedToken;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let ethers: any;

  before(async function () {
    const connection = await network.connect();
    ethers = connection.ethers;
  });

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    proxy = await ethers.deployContract("Proxy");
    implementation = await ethers.deployContract("GovernedToken");
  });

  describe("部署", function () {
    it("应该正确设置所有者", async function () {
      expect(await proxy.owner()).to.equal(owner.address);
    });

    it("初始目标地址应该为零地址", async function () {
      const targetAddr = await proxy.implementation();
      expect(targetAddr).to.equal(ethers.ZeroAddress);
    });
  });

  describe("设置目标合约", function () {
    it("所有者应该能够设置目标合约", async function () {
      const implAddr = await implementation.getAddress();
      await expect(proxy.setTarget(implAddr))
        .to.emit(proxy, "ProxyTargetSet")
        .withArgs(ethers.ZeroAddress, implAddr);
      
      const targetAddr = await proxy.implementation();
      expect(targetAddr).to.equal(implAddr);
    });

    it("非所有者不能设置目标合约", async function () {
      const implAddr = await implementation.getAddress();
      await expect(
        proxy.connect(addr1).setTarget(implAddr)
      ).to.be.revertedWith("Not owner");
    });

    it("应该能够更新目标合约", async function () {
      const implAddr = await implementation.getAddress();
      await proxy.setTarget(implAddr);
      
      const implementation2 = await ethers.deployContract("GovernedToken");
      const impl2Addr = await implementation2.getAddress();
      
      await expect(proxy.setTarget(impl2Addr))
        .to.emit(proxy, "ProxyTargetSet")
        .withArgs(implAddr, impl2Addr);
      
      const targetAddr = await proxy.implementation();
      expect(targetAddr).to.equal(impl2Addr);
    });
  });

  describe("所有权管理", function () {
    it("所有者应该能够转移所有权", async function () {
      await expect(proxy.setOwner(addr1.address))
        .to.emit(proxy, "ProxyOwnerChanged")
        .withArgs(owner.address, addr1.address);
      
      expect(await proxy.owner()).to.equal(addr1.address);
    });

    it("非所有者不能转移所有权", async function () {
      await expect(
        proxy.connect(addr1).setOwner(addr2.address)
      ).to.be.revertedWith("Not owner");
    });

    it("新所有者应该能够设置目标合约", async function () {
      await proxy.setOwner(addr1.address);
      const implAddr = await implementation.getAddress();
      await expect(proxy.connect(addr1).setTarget(implAddr))
        .to.emit(proxy, "ProxyTargetSet");
    });

    it("旧所有者不能再设置目标合约", async function () {
      await proxy.setOwner(addr1.address);
      const implAddr = await implementation.getAddress();
      await expect(
        proxy.setTarget(implAddr)
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("代理功能", function () {
    let proxiedToken: GovernedToken;

    beforeEach(async function () {
      const implAddr = await implementation.getAddress();
      await proxy.setTarget(implAddr);
      proxiedToken = await ethers.getContractAt("GovernedToken", await proxy.getAddress()) as GovernedToken;
      await proxiedToken.init();
    });

    it("未设置目标时调用应该失败", async function () {
      const emptyProxy = await ethers.deployContract("Proxy");
      const proxiedEmpty = await ethers.getContractAt("GovernedToken", await emptyProxy.getAddress());
      
      await expect(proxiedEmpty.name()).to.be.revertedWith("Target not set");
    });

    it("应该能够通过代理调用实现合约的函数", async function () {
      expect(await proxiedToken.name()).to.equal("Governed Token");
      expect(await proxiedToken.symbol()).to.equal("GOV");
    });

    it("应该能够通过代理发行代币", async function () {
      await expect(proxiedToken.mint(addr1.address, 100))
        .to.emit(proxiedToken, "Issue")
        .withArgs(addr1.address, 100);
      
      expect(await proxiedToken.balanceOf(addr1.address)).to.equal(100);
    });

    it("应该能够通过代理赎回代币", async function () {
      await proxiedToken.mint(addr1.address, 100);
      await expect(proxiedToken.burn(addr1.address, 50))
        .to.emit(proxiedToken, "Redeem")
        .withArgs(addr1.address, 50);
      
      expect(await proxiedToken.balanceOf(addr1.address)).to.equal(50);
    });

    it("代理状态应该独立于实现合约", async function () {
      await proxiedToken.mint(addr1.address, 100);
      
      expect(await proxiedToken.balanceOf(addr1.address)).to.equal(100);
      expect(await implementation.balanceOf(addr1.address)).to.equal(0);
    });

    it("应该能够升级到新的实现合约", async function () {
      await proxiedToken.mint(addr1.address, 100);
      
      const implementation2 = await ethers.deployContract("GovernedToken");
      const impl2Addr = await implementation2.getAddress();
      
      await proxy.setTarget(impl2Addr);
      
      expect(await proxiedToken.balanceOf(addr1.address)).to.equal(100);
    });
  });
});
