
// Load Ethereum
const Eth = require('ethjs');
const fs = require('fs');
const etheriumEndpoint = 'https://ropsten.infura.io';
const testEtherium = 'http://127.0.0.1:7545';
const endpoint = process.env.DEV ? testEtherium : etheriumEndpoint;
const instanceClass = require('./contracts/ZapRegistry');
const eth = new Eth(new Eth.HttpProvider(endpoint));
const ZapWrapper = require('./ZapWrapper');
const address = process.env.ADDRESS || '';
const abiPath = __dirname + '/../contracts/abis/ZapRegistry.json';

if (!address) {
    throw new Error('Didn\'t provide contact address');
}

const instanceZapRegistry = new ZapWrapper(eth);

const zapRegistry = instanceZapRegistry.initClass({
    instanceClass,
    address,
    abiPath
});

zapRegistry.initiateProvider({
    publicKey: 111,
    route_keys: [1], 
    title: 'test',
    from: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57'
})
    .then(data => console.log('initiateProvider',data))
    .catch(err => console.log('initiateProvider err',err));

zapRegistry.initiateProviderCurve({ 
    specifier: '0xb5ba53bc5ca7cdd6c97be54f7d4e82a5d923be7665deef14398f34a108fb3b89',
    ZapCurveType: 'ZapCurveNone',
    curveStart: 1,
    curveMultiplier: 2,
    from: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57'
})
    .then(data => console.log('initiateProviderCurve',data))
    .catch(err => console.log('initiateProviderCurve err',err));

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
