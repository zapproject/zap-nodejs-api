const { eth } = require('./bootstrap');
const { network_id } = require('../config');
const objectToCreate = { from: '0x627306090abab3a6e1400e9345bc60c78a8bef57', gas: 6000000 };
const { fromAscii, toBN } = require('ethjs');
const BigNumber = require('bignumber.js');

function getInstanceOfSmartContract(abiFile) {
    return eth.contract(abiFile.abi).at(abiFile.networks[network_id].address);
}

async function getNewSmartContract(abiFile) {
    const contract = getEthContract(abiFile);
    const txHash = await contract.new(objectToCreate);
    const { contractAddress } = await eth.getTransactionReceipt(txHash);
    return eth.contract(abiFile.abi).at(contractAddress);
}

async function getNewRegistryContract({ abiFile, regStoreAddress }) {
    const contract = getEthContract(abiFile);
    const txHash = await contract.new(regStoreAddress, objectToCreate);
    const { contractAddress } = await eth.getTransactionReceipt(txHash);
    return eth.contract(abiFile.abi).at(contractAddress);
}

async function getNewBondageContract({ abiFile, pointerAddress, bondStoreAddress, tokenAddress, currentCostAddress }) {
    const contract = getEthContract(abiFile);
    const txHash = await contract.new(
        pointerAddress,
        bondStoreAddress,
        tokenAddress,
        currentCostAddress,
        objectToCreate
    );
    const { contractAddress } = await eth.getTransactionReceipt(txHash);
    return eth.contract(abiFile.abi).at(contractAddress);
}

async function getNewArbiterContract({ abiFile, pointerAddress, arbiterStoreAddress, bondageAddress }) {
    const contract = getEthContract(abiFile);
    const txHash = await contract.new(
        pointerAddress,
        arbiterStoreAddress,
        bondageAddress,
        objectToCreate
    );
    const { contractAddress } = await eth.getTransactionReceipt(txHash);
    return eth.contract(abiFile.abi).at(contractAddress);
}

async function getNewDispatchContract({ abiFile, pointerAddress, dispatchStoreAddress, bondageAddress }) {
    const contract = getEthContract(abiFile);
    const txHash = await contract.new(
        pointerAddress,
        dispatchStoreAddress,
        bondageAddress,
        objectToCreate
    );
    const { contractAddress } = await eth.getTransactionReceipt(txHash);
    return eth.contract(abiFile.abi).at(contractAddress);
}

function getEthContract({ abi, bytecode }) {
    return eth.contract(abi, bytecode);
}

async function getNewCurrentCostContract({ abiFile, pointerAddress, registryAddress }) {
    const contract = getEthContract(abiFile);
    const txHash = await contract.new(
        pointerAddress,
        registryAddress,
        objectToCreate
    );
    const { contractAddress } = await eth.getTransactionReceipt(txHash);
    return eth.contract(abiFile.abi).at(contractAddress);
}

async function getNewTestSubscriberContract({ abiFile, dispatchAddress, bondageAddress, tokenAddress }) {
    const contract = getEthContract(abiFile);
    const txHash = await contract.new(
        dispatchAddress,
        bondageAddress,
        tokenAddress,
        objectToCreate
    );
    const { contractAddress } = await eth.getTransactionReceipt(txHash);
    return eth.contract(abiFile.abi).at(contractAddress);
}

const curveType = {
    "ZapCurveNone": 0,
    "ZapCurveLinear": 1,
    "ZapCurveExponential": 2,
    "ZapCurveLogarithmic": 3
};

const providerTitle = fromAscii("test");
const providerPublicKey = 111;
const ZapCurveType = 'ZapCurveLinear';
const curveStart = 1;
const curveMultiplier = 1;
const param1 = new String("p1");
const param2 = new String("p2");
const params = [fromAscii(param1.valueOf()), fromAscii(param2.valueOf())];
const specifier = "test-linear-specifier";
const oracleEndpoint = fromAscii(specifier.valueOf());
const gasTransaction = toBN(3000000);
const tokensForOwner = new BigNumber("1e30");
const tokensForOracle = new BigNumber('1e24');
const allocateAccount = 300000;
const query = "Why?";


module.exports = {
    getInstanceOfSmartContract,
    getNewSmartContract,
    getNewBondageContract,
    getNewArbiterContract,
    getNewDispatchContract,
    getNewRegistryContract,
    curveType,
    providerTitle,
    providerPublicKey,
    ZapCurveType,
    curveStart,
    curveMultiplier,
    params,
    specifier,
    oracleEndpoint,
    gasTransaction,
    tokensForOwner,
    tokensForOracle,
    allocateAccount,
    getNewCurrentCostContract,
    param1,
    param2,
    query,
    getNewTestSubscriberContract
};
