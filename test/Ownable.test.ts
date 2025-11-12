import { expect } from "chai";
import { network } from "hardhat";
import type { GovernedToken } from "../types/ethers-contracts/logic/SureSharesToken.sol/GovernedToken.js";

describe("Ownable", function () {
  let contract: GovernedToken;
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
    
    contract = await ethers.deployContract("GovernedToken") as GovernedToken;
    await contract.init();
  });

  describe("初始化", function () {
    it("应该正确设置初始所有者", async function () {
      expect(await contract.contractOwner()).to.equal(owner.address);
    });

    it("应该触发 OwnershipTransferred 事件", async function () {
      const newContract = await ethers.deployContract("GovernedToken");
      
      await expect(newContract.init())
        .to.emit(newContract, "OwnershipTransferred")
        .withArgs(ethers.ZeroAddress, owner.address);
    });
  });

  describe("contractOwner", function () {
    it("应该返回当前所有者地址", async function () {
      expect(await contract.contractOwner()).to.equal(owner.address);
    });

    it("转移所有权后应该返回新所有者", async function () {
      await contract.transferOwnership(addr1.address);
      expect(await contract.contractOwner()).to.equal(addr1.address);
    });
  });

  describe("isOwner", function () {
    it("所有者调用应该返回 true", async function () {
      expect(await contract.isOwner()).to.be.true;
    });

    it("非所有者调用应该返回 false", async function () {
      expect(await contract.connect(addr1).isOwner()).to.be.false;
    });

    it("转移所有权后，新所有者应该返回 true", async function () {
      await contract.transferOwnership(addr1.address);
      expect(await contract.connect(addr1).isOwner()).to.be.true;
    });

    it("转移所有权后，旧所有者应该返回 false", async function () {
      await contract.transferOwnership(addr1.address);
      expect(await contract.isOwner()).to.be.false;
    });
  });

  describe("onlyOwner 修饰符", function () {
    it("所有者应该能够调用受保护的函数", async function () {
      await expect(contract.issue(addr1.address, 100))
        .to.emit(contract, "Issue");
    });

    it("非所有者不能调用受保护的函数", async function () {
      await expect(
        contract.connect(addr1).issue(addr2.address, 100)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("transferOwnership", function () {
    it("所有者应该能够转移所有权", async function () {
      await expect(contract.transferOwnership(addr1.address))
        .to.emit(contract, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);
      
      expect(await contract.contractOwner()).to.equal(addr1.address);
    });

    it("非所有者不能转移所有权", async function () {
      await expect(
        contract.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("不能转移所有权给零地址", async function () {
      await expect(
        contract.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Ownable: new owner is the zero address");
    });

    it("应该正确触发事件", async function () {
      await expect(contract.transferOwnership(addr1.address))
        .to.emit(contract, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);
    });

    it("新所有者应该能够再次转移所有权", async function () {
      await contract.transferOwnership(addr1.address);
      
      await expect(contract.connect(addr1).transferOwnership(addr2.address))
        .to.emit(contract, "OwnershipTransferred")
        .withArgs(addr1.address, addr2.address);
      
      expect(await contract.contractOwner()).to.equal(addr2.address);
    });
  });
});
