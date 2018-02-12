
// Load Ethereum
const Eth = require('ethjs');
const fs = require('fs');
const etheriumEndpoint = 'https://ropsten.infura.io';
const testEtherium = '127.0.0.1:7545';
const endpoint = process.env.DEV ? testEtherium : etheriumEndpoint;
const ZapRegistry = require('./contracts/ZapRegistry');
const eth = new Eth(new Eth.HttpProvider(endpoint));
const ZapWrapper = require('./ZapWrapper');
const address = process.env.ADDRESS || '';
const abiPath = '../contracts/abis/ZapRegistry.json';
const abiBufferFile = fs.readFileSync(abiPath);
const abiFile = JSON.parse(abiBufferFile);

if (!address) {
    throw new Error('Didn\'t provide contact address');
}

const instanceZapRegistry = new ZapWrapper({
    class: ZapRegistry,
    eth,
    address,
});

const zapRegistry = instanceZapRegistry.initClass();

zapRegistry.initiateProvider(abiFile);

// to use ZapWrapper should use that type of request 
// DEV=true ADDRESS=0x79e036bdde21a4e5e149002d81d3b570ff8df42e 
// ABI_PATH=../contracts/abis/ZapRegistry.json 
// node 

// Get Balance
// wallet.getBalance((err, balance) => {
//     console.log("You have", balance, "ZAP");
// });

// // Send 10 ZAP
// wallet.send("0xadasda...", 10, (err, success) => {
//     if ( err ) throw err;

//     console.log(success ? "You sent 10 ZAP" : "Failed to send ZAP");
// });

// const registry = new ZapRegistry(eth, 'ropsten');

// registry.getOracle('0xasdfasdfa...', (err, oracle) => {
//     if ( err ) throw err;

//     // Estimate the bond 10 ZAP to 0xasdfasf's smartcontract endpoint
//     wallet.bondage.estimateBond(oracle, "smartcontract", 10, (err, numZap, numDot) => {
//         if ( err ) throw err;

//         console.log("You would receive", numDot);
//         console.log("There would be", numZap, "left over");
//     });

//     // Bond 10 ZAP to 0xasdfasf's smartcontract endpoint
//     wallet.bond(oracle, "smartcontract", 10, (err, numZap, numDot) => {
//         if ( err ) throw err;

//         console.log("You received", numDot);
//         console.log("There was", numZap, "left over");
//     });

//     // Unbond 10 ZAP to 0xasdfasf's smartcontract endpoint
//     wallet.unbond(oracle, "smartcontract", 10, (err, numZap, numDot) => {
//         if ( err ) throw err;

//         console.log("You received", numDot);
//         console.log("There was", numZap, "left over");
//     });
// });
