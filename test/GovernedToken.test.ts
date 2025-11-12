import { expect } from "chai";
import { network } from "hardhat";
import type { GovernedToken } from "../types/ethers-contracts/logic/SureSharesToken.sol/GovernedToken.js";

describe("GovernedToken", function () {
  let token: GovernedToken;
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
    
    token = await ethers.deployContract("GovernedToken") as GovernedToken;
    await token.init();
  });

  describe("部署和初始化", function () {
    it("应该正确设置代币名称", async function () {
      expect(await token.name()).to.equal("Sure AM Shares");
    });

    it("应该正确设置代币符号", async function () {
      expect(await token.symbol()).to.equal("Governed");
    });

    it("应该正确设置小数位数为0", async function () {
      expect(await token.decimals()).to.equal(0);
    });

    it("应该返回正确的描述", async function () {
      expect(await token.description()).to.equal("Sure Asset Management Shares Tokenization Contract");
    });

    it("应该返回正确的版本号", async function () {
      expect(await token.Version()).to.equal("0");
    });

    it("应该正确设置合约所有者", async function () {
      expect(await token.contractOwner()).to.equal(owner.address);
    });
  });

  describe("发行代币 (Issue)", function () {
    it("所有者应该能够发行代币", async function () {
      const amount = 100;
      await expect(token.issue(addr1.address, amount))
        .to.emit(token, "Issue")
        .withArgs(addr1.address, amount);
      
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });

    it("应该正确更新总供应量", async function () {
      const amount = 100;
      await token.issue(addr1.address, amount);
      expect(await token.totalSupply()).to.equal(amount);
    });

    it("非所有者不能发行代币", async function () {
      await expect(
        token.connect(addr1).issue(addr2.address, 100)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("应该能够多次发行代币", async function () {
      await token.issue(addr1.address, 50);
      await token.issue(addr1.address, 30);
      expect(await token.balanceOf(addr1.address)).to.equal(80);
    });
  });

  describe("赎回代币 (Redeem)", function () {
    beforeEach(async function () {
      await token.issue(addr1.address, 100);
    });

    it("所有者应该能够赎回代币", async function () {
      const amount = 50;
      await expect(token.redeem(addr1.address, amount))
        .to.emit(token, "Redeem")
        .withArgs(addr1.address, amount);
      
      expect(await token.balanceOf(addr1.address)).to.equal(50);
    });

    it("应该正确更新总供应量", async function () {
      await token.redeem(addr1.address, 50);
      expect(await token.totalSupply()).to.equal(50);
    });

    it("非所有者不能赎回代币", async function () {
      await expect(
        token.connect(addr1).redeem(addr1.address, 50)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("赎回数量超过余额应该失败", async function () {
      await expect(
        token.redeem(addr1.address, 150)
      ).to.be.revertedWith("Insufficient token");
    });

    it("应该能够赎回全部代币", async function () {
      await token.redeem(addr1.address, 100);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });
  });

  describe("转账限制", function () {
    beforeEach(async function () {
      await token.issue(addr1.address, 100);
    });

    it("transfer 应该被禁用", async function () {
      await expect(
        token.connect(addr1).transfer(addr2.address, 50)
      ).to.be.revertedWith("unsupported");
    });

    it("transferFrom 应该被禁用", async function () {
      await token.connect(addr1).approve(owner.address, 50);
      await expect(
        token.transferFrom(addr1.address, addr2.address, 50)
      ).to.be.revertedWith("unsupported");
    });
  });

  describe("所有权管理", function () {
    it("应该能够转移所有权", async function () {
      await expect(token.transferOwnership(addr1.address))
        .to.emit(token, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);
      
      expect(await token.contractOwner()).to.equal(addr1.address);
    });

    it("新所有者应该能够发行代币", async function () {
      await token.transferOwnership(addr1.address);
      await expect(token.connect(addr1).issue(addr2.address, 100))
        .to.emit(token, "Issue");
    });

    it("旧所有者不能再发行代币", async function () {
      await token.transferOwnership(addr1.address);
      await expect(
        token.issue(addr2.address, 100)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("非所有者不能转移所有权", async function () {
      await expect(
        token.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("不能转移所有权给零地址", async function () {
      await expect(
        token.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Ownable: new owner is the zero address");
    });

    it("isOwner 应该正确返回", async function () {
      expect(await token.isOwner()).to.be.true;
      expect(await token.connect(addr1).isOwner()).to.be.false;
    });
  });
});
