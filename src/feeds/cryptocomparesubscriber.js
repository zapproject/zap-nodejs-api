const ZapSubscriber = require('../api/subscriber.js');
const marketAddress = "0x732a5496383DE6A55AE2Acc8829BE7eCE0833113";
const subscriber = new ZapSubscriber(marketAddress, ".synapsesubscriber");
const Web3 = require('web3');
const accounts = require('../account.js');

const rpcHost = "https://rinkeby.infura.io";
const web3 = new Web3(new Web3.providers.HttpProvider(rpcHost));

// Accounts
const privateKeyHex = "0x7909ef9ab5279d31a74b9f49c58cf5be5c033ae7e9d7e2eb46a071b9802c5e22";
const account = new accounts(privateKeyHex);

account.setWeb3(web3);
const ZapDataProxy_abi = [{ "constant": false, "inputs": [{ "name": "providerGroup", "type": "uint256" }, { "name": "providerIndex", "type": "uint256" }, { "name": "zapStake", "type": "uint256" }, { "name": "var1", "type": "bytes32" }, { "name": "var2", "type": "bytes32" }, { "name": "trigger", "type": "bytes32" }], "name": "oracleEventRequest", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "providerGroup", "type": "uint256" }, { "indexed": false, "name": "providerIndex", "type": "uint256" }, { "indexed": false, "name": "zapStake", "type": "uint256" }, { "indexed": false, "name": "var1", "type": "bytes32" }, { "indexed": false, "name": "var2", "type": "bytes32" }, { "indexed": false, "name": "trigger", "type": "bytes32" }], "name": "OracleEventRequest", "type": "event" }]
const ZapDataProxy = new web3.eth.Contract(ZapDataProxy_abi, "0x0753740e1939ff47c5b916bf6385c907333894f9");

subscriber.newSubscriptionWithIndex(0, "danny01", 10, (err, data) => {
    console.log(765765, err);
    console.log(973, data);
}).then(() => {
    console.log("Sending conditions");
    //uint providerGroup, uint providerIndex, uint zapStake, bytes32 var1, bytes32 var2, bytes32 trigger
    ZapDataProxy.methods.oracleEventRequest("0x" + Buffer.from("danny01").toString("hex"), 0, 0, web3.utils.utf8ToHex("0~Poloniex~BTC~USD"), web3.utils.utf8ToHex("asdf"), web3.utils.utf8ToHex("")).send({
        from: web3.eth.accounts.wallet[0].address,
        gas: 4700000 // TODO - not this
    }).on("error", (error) => {
        console.log("ZapDataProxy", error);
    }).then((receipt) => {
        console.log("Sent conditions")
    })
});
