const Eth = require('ethjs'); // ethereum utils lib
const fs = require('fs');
const path = require('path');
const { fromAscii } = require('ethjs');
const Web3 = require('web3');
const MyProvider = require('../src/api/MyZapProvider');

const testEtherium = `http://127.0.0.1:9545`; // truffle develop rpc
const eth = new Eth(new Eth.HttpProvider(testEtherium)); // using develop rpc
const web3 = new Web3(new Web3.providers.HttpProvider(testEtherium));

const zapTokenJson = JSON.parse(fs.readFileSync('../zap/build/contracts/ZapToken.json').toString());
const zapDispatchJson = JSON.parse(fs.readFileSync('../zap/build/contracts/Dispatch.json').toString());
const zapBondageJson = JSON.parse(fs.readFileSync('../zap/build/contracts/Bondage.json').toString());
const zapRegistryJson = JSON.parse(fs.readFileSync('../zap/build/contracts/Registry.json').toString());
const registryStorageJson = JSON.parse(fs.readFileSync('../zap/build/contracts/RegistryStorage.json').toString());

const CurveTypes = {
    "None": 0,
    "Linear": 1,
    "Exponential": 2,
    "Logarithmic": 3
};

/**
 * truffle json files contains all contract info
 *
 * get contract abi from this file
 * @param json - json object parsed from json file
 * @returns {*} abi of contract
 */
function getContractAbi(json) {
    if (!json.abi) {
        throw new Error('File doesn\'t contain abi!');
    }

    return json.abi;
}


/**
 * get contract address for specified network id from truffle file
 *
 * @param json - json object parsed from json file
 * @param networkId - id of network
 * @returns {*} contract address in specified network
 */
function getContractAddress(json, networkId) {
    if (!json.networks[networkId] || !json.networks[networkId].address) {
        throw new Error('File doesn\'t contain contract address for network with id = ' + networkId + '!');
    }

    console.log('Contract ' + json.contractName + ' have ' + json.networks[networkId].address + ' address.');
    return json.networks[networkId].address;
}


async function main() {
    const accounts = await eth.accounts();

    const owner = accounts[0];
    const oracle = accounts[1];
    const sub = accounts[2];

    console.log('owner: ' + owner);
    console.log('oracle: ' + oracle);
    console.log('sub: ' + sub);

    const testEndpoint = 'test.com';

    const zapToken = eth.contract(getContractAbi(zapTokenJson)).at(getContractAddress(zapTokenJson, 4447));
    const zapRegistry =  eth.contract(getContractAbi(zapRegistryJson)).at(getContractAddress(zapRegistryJson, 4447));
    const zapDispatch = eth.contract(getContractAbi(zapDispatchJson)).at(getContractAddress(zapDispatchJson, 4447));
    const zapBondage = eth.contract(getContractAbi(zapBondageJson)).at(getContractAddress(zapBondageJson, 4447));

    const registryStorage = eth.contract(getContractAbi(registryStorageJson)).at(getContractAddress(registryStorageJson, 4447));


    async function allocateTokens(to, amount) {
        await zapToken.allocate(to, amount, {from: owner});
        getBalance(to);
    }

    async function getBalance(address) {
        const balance  = await zapToken.balanceOf(address, {from: owner});
        console.log('Address ' + address + ' have tokens: ' + balance[0].toString());
        return balance[0].toString();
    }

    async function registerNewDataProvider(publicKey,
                                           title,
                                           endpoint,
                                           endpointParams) {

        let pk = await zapRegistry.getProviderPublicKey(oracle);

        if (pk[0].valueOf() !== '0') return;


        await zapRegistry.initiateProvider(publicKey, fromAscii(title), fromAscii(endpoint), endpointParams, {from: oracle});

        await zapRegistry.initiateProviderCurve(fromAscii(endpoint), CurveTypes['Linear'], 1, 2, {from: oracle});

        //check results
        pk = await zapRegistry.getProviderPublicKey(oracle);
        console.log('Received pk of oracle: ' + pk[0].valueOf());
        if (pk[0].valueOf() === '0') {
            throw new Error('Public key of provider was not specified!');
        }
    }

    async function bondToDataProvider(oracleAddress,
                                      endpoint,
                                      numZap) {
        await zapToken.approve(zapBondage.address, await getBalance(sub), {from: sub});

        await zapBondage.bond(oracle, fromAscii(endpoint), numZap, {from: sub});
    }

    async function queryData(provider,
                             userQuery,
                             endpoint,
                             endpointParams) {
        await zapDispatch.query(provider, userQuery, fromAscii(endpoint), endpointParams, {from: sub});
    }

    async function initProvider() {
        const myProvider = new MyProvider('truffle_develop');
        myProvider.subscribeDispatchQueries(zapDispatch.address, function (error, result) {
            if (error) {
                console.log('Error while receiving FulfillQuery event!');
            } else {
                console.log(result);
                myProvider.unsubscribeDispatchQueries();
            }
        })
    }

    await allocateTokens(sub, Eth.toBN('1e24'));
    await allocateTokens(oracle,  Eth.toBN('1e24'));

    await registerNewDataProvider(111, 'test', testEndpoint, []);
    await bondToDataProvider(oracle, testEndpoint, 10);

    await initProvider();

    await queryData(sub, oracle, 'privet ' + i, testEndpoint, []);

    return 0;
}

/**
 * ENTRY POINT
 */
main().then((res) => {
    if (res === 0) {
        console.log('\n\nExecuted with result code: ' + res);
    } else {
        console.log('\n\nExecution error!');
    }
});
