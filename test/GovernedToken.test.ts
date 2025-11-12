import { expect } from "chai";
import { network } from "hardhat";
import type { GovernedToken } from "../types/ethers-contracts/logic/GovernedToken.js";

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
      expect(await token.name()).to.equal("Governed Token");
    });

    it("应该正确设置代币符号", async function () {
      expect(await token.symbol()).to.equal("GOV");
    });

    it("应该正确设置小数位数为18", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("应该返回正确的描述", async function () {
      expect(await token.description()).to.equal("ERC-20 Governed Token with Fixed Supply");
    });

    it("应该返回正确的版本号", async function () {
      expect(await token.Version()).to.equal("1");
    });

    it("应该正确设置合约所有者", async function () {
      expect(await token.contractOwner()).to.equal(owner.address);
    });

    it("应该铸造固定总量到部署者地址", async function () {
      const expectedSupply = ethers.parseEther("25000000");
      expect(await token.totalSupply()).to.equal(expectedSupply);
      expect(await token.balanceOf(owner.address)).to.equal(expectedSupply);
    });
  });

  describe("铸造功能 (Mint)", function () {
    it("所有者应该能够铸造代币", async function () {
      const amount = ethers.parseEther("1000");
      await expect(token.mint(addr1.address, amount))
        .to.emit(token, "Issue")
        .withArgs(addr1.address, amount);
      
      const expectedBalance = ethers.parseEther("1000");
      expect(await token.balanceOf(addr1.address)).to.equal(expectedBalance);
    });

    it("非所有者不能铸造代币", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        token.connect(addr1).mint(addr2.address, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("不能给黑名单地址铸造代币", async function () {
      await token.addToBlacklist(addr1.address);
      const amount = ethers.parseEther("100");
      await expect(
        token.mint(addr1.address, amount)
      ).to.be.revertedWith("Address is blacklisted");
    });
  });

  describe("销毁功能 (Burn)", function () {
    it("所有者应该能够销毁代币", async function () {
      const amount = ethers.parseEther("1000");
      await expect(token.burn(owner.address, amount))
        .to.emit(token, "Redeem")
        .withArgs(owner.address, amount);
    });

    it("销毁数量超过余额应该失败", async function () {
      const amount = ethers.parseEther("100000000000");
      await expect(
        token.burn(addr1.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("转账功能", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      await token.transfer(addr1.address, amount);
    });

    it("应该能够正常转账", async function () {
      const amount = ethers.parseEther("100");
      await token.connect(addr1).transfer(addr2.address, amount);
      
      expect(await token.balanceOf(addr2.address)).to.equal(amount);
    });

    it("应该能够使用 transferFrom", async function () {
      const amount = ethers.parseEther("100");
      await token.connect(addr1).approve(owner.address, amount);
      
      await token.transferFrom(addr1.address, addr2.address, amount);
      
      expect(await token.balanceOf(addr2.address)).to.equal(amount);
    });

    it("暂停后不能转账", async function () {
      await token.pause();
      const amount = ethers.parseEther("100");
      await expect(
        token.connect(addr1).transfer(addr2.address, amount)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("黑名单地址不能转账", async function () {
      await token.addToBlacklist(addr1.address);
      const amount = ethers.parseEther("100");
      await expect(
        token.connect(addr1).transfer(addr2.address, amount)
      ).to.be.revertedWith("Address is blacklisted");
    });

    it("冻结地址不能转账", async function () {
      await token.freezeAddress(addr1.address);
      const amount = ethers.parseEther("100");
      await expect(
        token.connect(addr1).transfer(addr2.address, amount)
      ).to.be.revertedWith("Address is frozen");
    });
  });

  describe("黑名单功能", function () {
    it("所有者应该能够添加黑名单", async function () {
      await expect(token.addToBlacklist(addr1.address))
        .to.emit(token, "AddedToBlacklist")
        .withArgs(addr1.address);
      
      expect(await token.isBlacklisted(addr1.address)).to.be.true;
    });

    it("所有者应该能够移除黑名单", async function () {
      await token.addToBlacklist(addr1.address);
      
      await expect(token.removeFromBlacklist(addr1.address))
        .to.emit(token, "RemovedFromBlacklist")
        .withArgs(addr1.address);
      
      expect(await token.isBlacklisted(addr1.address)).to.be.false;
    });

    it("非所有者不能操作黑名单", async function () {
      await expect(
        token.connect(addr1).addToBlacklist(addr2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("地址冻结功能", function () {
    it("所有者应该能够冻结地址", async function () {
      await expect(token.freezeAddress(addr1.address))
        .to.emit(token, "AddressFrozen")
        .withArgs(addr1.address);
      
      expect(await token.isFrozen(addr1.address)).to.be.true;
    });

    it("所有者应该能够解冻地址", async function () {
      await token.freezeAddress(addr1.address);
      
      await expect(token.unfreezeAddress(addr1.address))
        .to.emit(token, "AddressUnfrozen")
        .withArgs(addr1.address);
      
      expect(await token.isFrozen(addr1.address)).to.be.false;
    });

    it("非所有者不能冻结地址", async function () {
      await expect(
        token.connect(addr1).freezeAddress(addr2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("全局暂停功能", function () {
    it("所有者应该能够暂停合约", async function () {
      await token.pause();
      expect(await token.paused()).to.be.true;
    });

    it("所有者应该能够恢复合约", async function () {
      await token.pause();
      await token.unpause();
      expect(await token.paused()).to.be.false;
    });

    it("非所有者不能暂停合约", async function () {
      await expect(
        token.connect(addr1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("强制转移功能", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      await token.transfer(addr1.address, amount);
    });

    it("所有者应该能够强制转移代币", async function () {
      const amount = ethers.parseEther("100");
      await expect(token.forceTransfer(addr1.address, addr2.address, amount))
        .to.emit(token, "ForcedTransfer")
        .withArgs(addr1.address, addr2.address, amount);
      
      expect(await token.balanceOf(addr2.address)).to.equal(amount);
    });

    it("非所有者不能强制转移", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        token.connect(addr1).forceTransfer(addr1.address, addr2.address, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("强制转移可以绕过冻结限制", async function () {
      await token.freezeAddress(addr1.address);
      const amount = ethers.parseEther("100");
      
      await expect(token.forceTransfer(addr1.address, addr2.address, amount))
        .to.emit(token, "ForcedTransfer");
    });
  });

  describe("所有权管理", function () {
    it("应该能够转移所有权", async function () {
      await expect(token.transferOwnership(addr1.address))
        .to.emit(token, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);
      
      expect(await token.contractOwner()).to.equal(addr1.address);
    });

    it("新所有者应该能够铸造代币", async function () {
      await token.transferOwnership(addr1.address);
      const amount = ethers.parseEther("100");
      await expect(token.connect(addr1).mint(addr2.address, amount))
        .to.emit(token, "Issue");
    });

    it("旧所有者不能再操作", async function () {
      await token.transferOwnership(addr1.address);
      const amount = ethers.parseEther("100");
      await expect(
        token.mint(addr2.address, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
