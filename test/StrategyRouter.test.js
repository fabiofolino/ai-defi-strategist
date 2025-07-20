const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StrategyRouter", function () {
  let strategyRouter;
  let mockStETH;
  let mockWstETH;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock contracts for testing
    const MockStETH = await ethers.getContractFactory("MockStETH");
    const MockWstETH = await ethers.getContractFactory("MockWstETH");

    mockStETH = await MockStETH.deploy();
    await mockStETH.waitForDeployment();
    
    mockWstETH = await MockWstETH.deploy(await mockStETH.getAddress());
    await mockWstETH.waitForDeployment();

    // Deploy StrategyRouter
    const StrategyRouter = await ethers.getContractFactory("StrategyRouter");
    strategyRouter = await StrategyRouter.deploy(
      await mockStETH.getAddress(),
      await mockWstETH.getAddress()
    );
    await strategyRouter.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct stETH and wstETH addresses", async function () {
      expect(await strategyRouter.stETH()).to.equal(await mockStETH.getAddress());
      expect(await strategyRouter.wstETH()).to.equal(await mockWstETH.getAddress());
    });

    it("Should set correct platform fee", async function () {
      expect(await strategyRouter.PLATFORM_FEE_BPS()).to.equal(100); // 1%
    });

    it("Should set correct minimum deposit", async function () {
      expect(await strategyRouter.MIN_DEPOSIT()).to.equal(ethers.parseEther("0.01"));
    });
  });

  describe("Deposits", function () {
    it("Should reject deposits below minimum", async function () {
      const depositAmount = ethers.parseEther("0.005"); // Below 0.01 ETH
      
      await expect(
        strategyRouter.connect(user1).deposit({ value: depositAmount })
      ).to.be.revertedWith("Deposit below minimum");
    });

    it("Should accept valid deposits and update user balance", async function () {
      const depositAmount = ethers.parseEther("1.0");
      const expectedFee = depositAmount * 100n / 10000n; // 1% fee
      const stakingAmount = depositAmount - expectedFee;

      // Mock the stETH submit to return the staking amount
      await mockStETH.setMockSubmitReturn(stakingAmount);
      await mockWstETH.setMockWrapReturn(stakingAmount); // 1:1 for simplicity

      // First approve the contract to spend stETH on behalf of itself
      await mockStETH.connect(user1).approve(await strategyRouter.getAddress(), ethers.MaxUint256);

      const tx = await strategyRouter.connect(user1).deposit({ value: depositAmount });
      await expect(tx).to.emit(strategyRouter, "Deposit");

      // Check user deposit
      const userDeposit = await strategyRouter.getUserDeposit(user1.address);
      expect(userDeposit.ethDeposited).to.equal(depositAmount);
      expect(userDeposit.wstETHBalance).to.equal(stakingAmount);
    });

    it("Should update contract statistics after deposit", async function () {
      const depositAmount = ethers.parseEther("1.0");
      const expectedFee = depositAmount * 100n / 10000n;
      const stakingAmount = depositAmount - expectedFee;

      await mockStETH.setMockSubmitReturn(stakingAmount);
      await mockWstETH.setMockWrapReturn(stakingAmount);

      await strategyRouter.connect(user1).deposit({ value: depositAmount });

      const stats = await strategyRouter.getContractStats();
      expect(stats.totalDeposited).to.equal(depositAmount);
      expect(stats.totalFees).to.equal(expectedFee);
      expect(stats.totalWstETH).to.equal(stakingAmount);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Setup initial deposit
      const depositAmount = ethers.parseEther("1.0");
      const stakingAmount = depositAmount - (depositAmount * 100n / 10000n);
      
      await mockStETH.setMockSubmitReturn(stakingAmount);
      await mockWstETH.setMockWrapReturn(stakingAmount);
      
      await strategyRouter.connect(user1).deposit({ value: depositAmount });
    });

    it("Should allow withdrawal of wstETH", async function () {
      const withdrawAmount = ethers.parseEther("0.5");
      
      const tx = await strategyRouter.connect(user1).withdraw(withdrawAmount);
      await expect(tx).to.emit(strategyRouter, "Withdrawal");

      // Check updated balance
      const userDeposit = await strategyRouter.getUserDeposit(user1.address);
      expect(userDeposit.wstETHBalance).to.be.lt(ethers.parseEther("0.99")); // Less than original
    });

    it("Should reject withdrawal of more than user balance", async function () {
      const withdrawAmount = ethers.parseEther("2.0"); // More than deposited
      
      await expect(
        strategyRouter.connect(user1).withdraw(withdrawAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should allow withdrawal as stETH", async function () {
      const withdrawAmount = ethers.parseEther("0.5");
      const mockStETHReturn = withdrawAmount; // 1:1 for simplicity
      
      await mockWstETH.setMockUnwrapReturn(mockStETHReturn);
      
      const tx = await strategyRouter.connect(user1).withdrawAsETH(withdrawAmount);
      await expect(tx).to.emit(strategyRouter, "Withdrawal");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to withdraw fees", async function () {
      // Make a deposit to generate fees
      const depositAmount = ethers.parseEther("1.0");
      const expectedFee = depositAmount * 100n / 10000n;
      const stakingAmount = depositAmount - expectedFee;
      
      await mockStETH.setMockSubmitReturn(stakingAmount);
      await mockWstETH.setMockWrapReturn(stakingAmount);
      
      await strategyRouter.connect(user1).deposit({ value: depositAmount });
      
      const tx = await strategyRouter.connect(owner).withdrawFees();
      await expect(tx).to.emit(strategyRouter, "FeesWithdrawn");

      // Check that fees were reset
      const stats = await strategyRouter.getContractStats();
      expect(stats.totalFees).to.equal(0);
    });

    it("Should reject fee withdrawal by non-owner", async function () {
      await expect(
        strategyRouter.connect(user1).withdrawFees()
      ).to.be.revertedWithCustomError(strategyRouter, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("Should correctly preview deposits", async function () {
      const depositAmount = ethers.parseEther("1.0");
      const expectedFee = depositAmount * 100n / 10000n;
      const stakingAmount = depositAmount - expectedFee;
      
      await mockWstETH.setMockGetWstETHByStETH(stakingAmount);
      
      const preview = await strategyRouter.previewDeposit(depositAmount);
      expect(preview.feeAmount).to.equal(expectedFee);
      expect(preview.wstETHAmount).to.equal(stakingAmount);
    });

    it("Should calculate user ETH value correctly", async function () {
      // Setup initial deposit
      const depositAmount = ethers.parseEther("1.0");
      const stakingAmount = depositAmount - (depositAmount * 100n / 10000n);
      
      await mockStETH.setMockSubmitReturn(stakingAmount);
      await mockWstETH.setMockWrapReturn(stakingAmount);
      await mockWstETH.setMockGetStETHByWstETH(stakingAmount);
      
      await strategyRouter.connect(user1).deposit({ value: depositAmount });
      
      const ethValue = await strategyRouter.getUserETHValue(user1.address);
      expect(ethValue).to.equal(stakingAmount);
    });
  });
});