const SynapseProvider = require('../api/provider.js');
const CryptoCompare = require('./cryptocompare.js');
const Web3 = require('web3');

// Create a listening RPC
const rpcHost_listen = "ws://dendritic.network:8546";
const web3 = new Web3(Web3.givenProvider || rpcHost_listen);
const ZapDataProxy_abi = [{ "constant": false, "inputs": [{ "name": "providerGroup", "type": "uint256" }, { "name": "providerIndex", "type": "uint256" }, { "name": "zapStake", "type": "uint256" }, { "name": "var1", "type": "bytes32" }, { "name": "var2", "type": "bytes32" }, { "name": "trigger", "type": "bytes32" }], "name": "oracleEventRequest", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "providerGroup", "type": "uint256" }, { "indexed": false, "name": "providerIndex", "type": "uint256" }, { "indexed": false, "name": "zapStake", "type": "uint256" }, { "indexed": false, "name": "var1", "type": "bytes32" }, { "indexed": false, "name": "var2", "type": "bytes32" }, { "indexed": false, "name": "trigger", "type": "bytes32" }], "name": "OracleEventRequest", "type": "event" }]
const ZapDataProxy_listen = new web3.eth.Contract(ZapDataProxy_abi, "0x0753740e1939ff47c5b916bf6385c907333894f9");

const provider = new SynapseProvider("danny01", 1,undefined, () => {
    //push cryptocompare data
    this.cryptocompare = new CryptoCompare();
    this.cryptocompare.on("data", (data) => {
        provider.publish(data);
    })

    //listen for conditions, TODO get filters to work
    ZapDataProxy_listen.events.OracleEventRequest({
        filter: { providerGroup: ["0x" + Buffer.from("danny01").toString("hex")] }
    }, (err, result) => {
        // Ignore errors
        if (err) {
            throw err;
        }
        console.log("timestamp", web3.utils.toBN(result.returnValues.trigger).toString());
        this.cryptocompare.setTimestamp(web3.utils.toBN(result.returnValues.trigger).toString());
        let subString = Buffer.from(result.returnValues.var1.substring(2), "hex").toString().replace(/\u0000+$/gm, '');
        console.log(JSON.stringify(subString));
        //https://www.cryptocompare.com/api/#-api-web-socket-subscribe-
        this.cryptocompare.subscribe(subString);
    })
});

