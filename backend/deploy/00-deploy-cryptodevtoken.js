// require("dotenv").config;
// const { ethers } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;
  const CRYPTODEVS_CONTRACT_ADDRESS = process.env.CRYPTODEVS_CONTRACT;

  const cryptodevToken = await deploy("CryptoDevToken", {
    from: deployer,
    log: true,
    args: [CRYPTODEVS_CONTRACT_ADDRESS],
  });

  log(`Crypto Devs Token Contract Address:${cryptodevToken.address}`);
};

module.exports.tags = ["all"];
