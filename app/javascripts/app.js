// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import {
  default as Web3
} from 'web3';
import {
  default as contract
} from 'truffle-contract'

// var Personal = require('web3-eth-personal');

// Import our contract artifacts and turn them into usable abstractions.
import crowdsale_artifacts from '../../build/contracts/Crowdsale.json'
import avra_artifacts from '../../build/contracts/AvraToken.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var Crowdsale = contract(crowdsale_artifacts);
var AvraToken = contract(avra_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;
var crowdsaleAddress;


window.App = {
  start: function () {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    Crowdsale.setProvider(web3.currentProvider);
    AvraToken.setProvider(web3.currentProvider);


    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }
      accounts = accs;
      account = accounts[0];



      var accountInterval = setInterval(function () {
        if (web3.eth.defaultAccount !== account) {
          account = web3.eth.accounts[0];
          window.App.updateCurrentAcc();
          self.refreshBalance();
        }
      }, 3000);

    });
  },

  setStatus: function (message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  updateCurrentAcc: function () {
    var curr_acc_element = document.getElementById('account')
    curr_acc_element.innerHTML = account.valueOf()
  },

  getTokenInstance: async function () {
    let crowdsale = await Crowdsale.deployed()
    let tokenAddress = await crowdsale.token()
    let avraInstance = AvraToken.at(tokenAddress)
    return avraInstance
  },


  refreshBalance: function () {
    var self = this;

    Crowdsale.deployed().then(function (instance) {
      crowdsaleAddress = instance.address

      instance.startTime().then(startTime => {
        var start_time_element = document.getElementById('start_time')
        start_time_element.innerHTML = App.timeConverter(startTime.c[0]).valueOf()

      })
      instance.endTime().then(endTime => {
        var result = endTime.c[0]
        var endTime_element = document.getElementById('end_time')
        endTime_element.innerHTML = App.timeConverter(result).valueOf()

      })

      var crowd_addr_element = document.getElementById('crowd_addr')
      crowd_addr_element.innerHTML = crowdsaleAddress.valueOf()
    })

    self.getTokenInstance().then(inst => {
      inst.balanceOf(account).then(bal => {
        var value = bal.c[0]
        var balance_element = document.getElementById("balance");
        balance_element.innerHTML = value.valueOf();
      })
    })
  },

  sendToken: function () {
    var self = this;


    var amount = parseInt(document.getElementById("send_amount").value);
    var receiver = document.getElementById("receiver").value;

    this.setStatus("Initiating transaction... (please wait)");


    self.getTokenInstance().then(inst => {
      inst.transfer(receiver, amount, {
        from: account
      })
    }).then(function () {
      self.setStatus("Transaction complete!");
      self.refreshBalance();
    }).catch(function (e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

  buyToken: function () {
    var eth_amount = parseInt(document.getElementById("buy_amount").value);
    var self = this;
    var sender = account;
    var receiver = crowdsaleAddress
    var amount = web3.toWei(eth_amount, "ether")

    this.setStatus("Initiating transaction... (please wait)");
    web3.eth.sendTransaction({ from: sender, to: receiver, value: amount }, function (err, result) {
      if (err) {
        console.log(err)
        self.setStatus("Error byuing coin; see log.")
      } else {
        self.setStatus("Transaction complete!");
        self.refreshBalance();
      }
    })
  },


  test: function () {
    var self = this;
    web3.eth.personal.newAccount('!@superpassword')
      .then(console.log);

  },

  timeConverter: function (UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
  }
};

window.addEventListener('load', function () {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
  }

  App.start();
});