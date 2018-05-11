const HttpsProvider = require('../src/api/HttpsProvider');
const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const TruffleContract = require("truffle-contract");
const ZapDispatch = require('../src/api/contracts/Dispatch');
const ZapArbiter = require('../src/api/contracts/Arbiter');

async function main() {
    const accounts = await web3.eth.getAccounts();

    const owner = accounts[0];
    const oracle = accounts[1];
    const sub = accounts[2];


    const zapTokenJson = JSON.parse(fs.readFileSync('../zap/build/contracts/ZapToken.json').toString());
    const zapDispatchJson = JSON.parse(fs.readFileSync('../zap/build/contracts/Dispatch.json').toString());
    const zapBondageJson = JSON.parse(fs.readFileSync('../zap/build/contracts/Bondage.json').toString());
    const zapRegistryJson = JSON.parse(fs.readFileSync('../zap/build/contracts/Registry.json').toString());
    const zapArbiterJson = JSON.parse(fs.readFileSync('../zap/build/contracts/Arbiter.json').toString());


    const zapToken = new web3.eth.Contract(getContractAbi(zapTokenJson), getContractAddress(zapTokenJson, testNetwork.id));
    const zapRegistry = new web3.eth.Contract(getContractAbi(zapRegistryJson), getContractAddress(zapRegistryJson, testNetwork.id));
    const zapDispatch = new web3.eth.Contract(getContractAbi(zapDispatchJson), getContractAddress(zapDispatchJson, testNetwork.id));
    const zapBondage = new web3.eth.Contract(getContractAbi(zapBondageJson), getContractAddress(zapBondageJson, testNetwork.id));
    const zapArbiter = new web3.eth.Contract(getContractAbi(zapArbiterJson), getContractAddress(zapArbiterJson, testNetwork.id));
}

main().then(() => {

});
