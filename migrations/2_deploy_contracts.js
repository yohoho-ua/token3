
var CrowdSale = artifacts.require("Crowdsale");
//var MintableToken = artifacts.require("MintableToken");

module.exports = function(deployer, network, accounts) {
  const startTime = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 1 // one second in the future
  const endTime = startTime + (86400 * 20) // 20 days
  const wallet = accounts[0]
  const rate = new web3.BigNumber(1000)
  console.log(startTime, endTime, wallet, rate)
  deployer.deploy(CrowdSale, startTime, endTime, rate, wallet)
};

