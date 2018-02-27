
// Load Ethereum
// This is an example of usage ZapWrapper file with Wrapper Class
// also added ability to get address from procces.env global variables
// To run this example use in console use command like
// DEV=true ADDRESS=0x8f0483125fcb9aaaefa9209d8e9d7b9c8b9fb90f node examples/wrapperExample.js
// Also in this example used network from Ganache UI 
// To use other network edit const testEtherium
const Eth = require('ethjs');
const fs = require('fs');
const {
    port,
    protocol,
    endpoint
} = require('../config');
const etheriumEndpoint = 'https://ropsten.infura.io';
const testEtherium = `${protocol}${endpoint}:${port}`;
const ethEndpoint = process.env.DEV ? testEtherium : etheriumEndpoint;
const eth = new Eth(new Eth.HttpProvider(ethEndpoint));
const ZapWrapper = require('../src/api/ZapWrapper');
const address = process.env.ADDRESS || '';
const path = require('path');
// in this example we were using Zapregistry smart contract
// if you are going to use another contract please review path to your abis json file
const abiFile = require(path.join(__dirname, '../ZapContracts/build/contracts/ZapRegistry.json'));
// const abiPath = __dirname + '../src/contracts/abis/ZapRegistry.json';
// Also if you try to test another wrapper for smart contract is different than ZapRegistry
// Specify way to your wrapper
const instanceClass = require('../src/api/contracts/ZapRegistry');

if (!address) {
    throw new Error('Didn\'t provide contact address');
}

const instanceZapRegistry = new ZapWrapper(eth);

const specifier = new String("test-linear-specifier");

const zapRegistry = instanceZapRegistry.initClass({
    instanceClass,
    address,
    abiPath: abiFile.abi
});

zapRegistry.initiateProvider({
    public_key: 43254352345,
    title: 'test',
    endpoint_specifier: specifier.valueOf(),
    endpoint_params: [],
    from: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57'
})
    .then(data => console.log('initiateProvider',data))
    .catch(err => console.log('initiateProvider err',err));

zapRegistry.initiateProviderCurve({ 
    specifier: specifier.valueOf(),
    ZapCurveType: 'ZapCurveNone',
    curveStart: 1,
    curveMultiplier: 2,
    from: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57'
})
    .then(data => console.log('initiateProviderCurve',data))
    .catch(err => console.log('initiateProviderCurve err',err));

zapRegistry.setEndpointParams({
    specifier: specifier.valueOf(),
    endpoint_params: [
        'urn:ed2k:354B15E68FB8F36D7CD88FF94116CDC1',
        'urn:tree:tiger:7N5OAMRNGMSSEUE3ORHOKWN4WWIQ5X4EBOOTLJY',
        'urn:btih:QHQXPYWMACKDWKP47RRVIV7VOURXFE5Q',
        'xl=10826029&dn=mediawiki-1.15.1.tar.gz'
    ],
    from: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57'
})
    .then(data => console.log('setEndpointsParams ==>>', data))
    .catch(err => console.log('setEndpointsParams err ==>>', err));

zapRegistry.getOracle('0x627306090abaB3A6e1400e9345bC60c78a8BEf57')
    .then(data => console.log('getOracle', data))
    .catch(err => console.log('getOracle err ==>>', err));
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
