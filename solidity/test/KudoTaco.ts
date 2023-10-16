import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256 } from "ethers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { type KudoTaco } from "../typechain-types";

const { parseEther } = ethers;
const KUDO_GIVER_ROLE = keccak256(ethers.toUtf8Bytes("KUDO_GIVER_ROLE"));

describe("Kudo Taco", function () {
  // deploy a kudo taco address so that we dont need to do this every test
  let kudoTaco: KudoTaco;
  beforeEach(async function () {
    const [owner, acct1] = await ethers.getSigners();
    const KudoTaco = await ethers.getContractFactory("KudoTaco");
    const kudoTacoDeployment = await KudoTaco.deploy(
      owner.address,
      "Kudo Taco",
      "KUDO"
    );
    kudoTaco = await kudoTacoDeployment.waitForDeployment();
    // give account 1 the KUDO_GIVER role
    await kudoTaco.grantRole(
      KUDO_GIVER_ROLE,      
      acct1.address
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const [owner] = await ethers.getSigners();
      expect(await kudoTaco.owner()).to.equal(owner.address);
    });
  });

  describe("Give Kudos", function () {
    it("Should give kudos from one user to another", async function () {
      const [, acct1, acct2] = await ethers.getSigners();
      await kudoTaco.connect(acct1).giveKudos(acct2.address, parseEther('1'));
      expect(await kudoTaco.balanceOf(acct2.address)).to.equal(ethers.toBigInt(parseEther('1')));
    });
    it("Should not allow an account to give more than 5 kudos per day", async function () {
      const [, acct1, acct2] = await ethers.getSigners();
      await kudoTaco.connect(acct1).giveKudos(acct2.address, parseEther('5'));
      await expect(kudoTaco.connect(acct1).giveKudos(acct2.address, 1)).to.be.revertedWith("Exceeds daily mint limit");
    });
    it("Should allow an account to give 5 kudos if they wait 1 day after exceeding their daily amount", async function () {
      const [, acct1, acct2] = await ethers.getSigners();
      await kudoTaco.connect(acct1).giveKudos(acct2.address, parseEther('5'));
      // wait one day
      await time.increase(60 * 60 * 24);
      await kudoTaco.connect(acct1).giveKudos(acct2.address, parseEther('5'));
      expect(await kudoTaco.balanceOf(acct2.address)).to.equal(ethers.toBigInt(parseEther('10')));
      // wait another day
      await time.increase(60 * 60 * 24);
      await kudoTaco.connect(acct1).giveKudos(acct2.address, parseEther('5'));
      expect(await kudoTaco.balanceOf(acct2.address)).to.equal(ethers.toBigInt(parseEther('15')));
    });
    it("Should allow an account to give multiple kudos in one call", async function () {
      const [, acct1, acct2, acct3, acct4] = await ethers.getSigners();
      await kudoTaco.connect(acct1).giveMultipleKudos(
        [acct2.address, acct3.address, acct4.address],
        [parseEther('1'), parseEther('2'), parseEther('2')]
      );
      expect(await kudoTaco.balanceOf(acct2.address)).to.equal(ethers.toBigInt(parseEther('1')));
      expect(await kudoTaco.balanceOf(acct3.address)).to.equal(ethers.toBigInt(parseEther('2')));
      expect(await kudoTaco.balanceOf(acct4.address)).to.equal(ethers.toBigInt(parseEther('2')));
    });
    it("Should not allow an account to give more than 5 kudos per day in one call", async function () {
      const [, acct1, acct2, acct3, acct4] = await ethers.getSigners();
      await kudoTaco.connect(acct1).giveMultipleKudos(
        [acct2.address, acct3.address, acct4.address],
        [parseEther('3'), parseEther('1'), parseEther('1')]
      );
      await expect(kudoTaco.connect(acct1).giveMultipleKudos(
        [acct2.address, acct3.address, acct4.address],
        [parseEther('1'), parseEther('1'), parseEther('1')]
      )).to.be.revertedWith("Exceeds daily mint limit");
    });
    it("Should not roll tacos over if they are not used in their daily amount", async function () {
      const [, acct1, acct2] = await ethers.getSigners();
      // give 2 under the daily amount
      await time.increase(60 * 60 * 24);
      await kudoTaco.connect(acct1).giveKudos(acct2.address, parseEther('3'));
      // wait 1 day
      await time.increase(60 * 60 * 24);
      // attempt to send 7 tacos (5 daily amount and 2 rolled over)
      await expect(kudoTaco.connect(acct1).giveKudos(
        acct2.address, 
        parseEther('7')
      )).to.be.revertedWith("Exceeds daily mint limit");
    });
    it("Should emit an event when giving kudos", async function () {
      const [, acct1, acct2] = await ethers.getSigners();
      await expect(kudoTaco.connect(acct1).giveKudos(
        acct2.address,
        parseEther('1')
      )).to.emit(kudoTaco.connect(acct1), 'KudosGiven').withArgs(
        acct1.address,
        acct2.address,
        parseEther('1')
      );
    });
    it("Should not allow users to give kudos to themselves", async function () {
      const [, acct1] = await ethers.getSigners();
      await expect(kudoTaco.connect(acct1).giveKudos(
        acct1.address,
        parseEther('1')
      )).to.be.revertedWith("Cannot mint to self.");
    });
    it("Should not allow users to give kudos unless they have been granted the KUDO_GIVER role", async function () {
      const [,,acct2, acct3] = await ethers.getSigners();
      expect(await kudoTaco.hasRole(KUDO_GIVER_ROLE, acct2.address)).to.be.false;
      await expect(kudoTaco.connect(acct2).giveKudos(
        acct3.address,
        parseEther('1')
      )).to.be.revertedWith(`Permissions: account ${acct2.address.toLowerCase()} is missing role ${KUDO_GIVER_ROLE}`);
    });
  });

  describe("Calculate kudos remaining", function () {
    it ("Should decrement kudos remaining when kudos are given", async function () {
      const [, acct1, acct2] = await ethers.getSigners();
      // expect kudos to be 5 initially
      expect(await kudoTaco.kudosRemainingToday(acct1.address)).to.equal(ethers.toBigInt(parseEther('5')));
      // give 1 kudos
      await kudoTaco.connect(acct1).giveKudos(acct2.address, parseEther('1'));
      expect(await kudoTaco.kudosRemainingToday(acct1.address)).to.equal(ethers.toBigInt(parseEther('4')));
    });
  });
});
