const fs = require('fs');
const path = require('path');
const { fromAscii } = require('ethjs');
const Web3 = require('web3');
const MyProvider = require('../src/api/MyZapProvider');
const ZapDispatch = require('../src/api/contracts/ZapDispatch');
const ZapArbiter = require('../src/api/contracts/ZapArbiter');

const testEtherium = `ws://127.0.0.1:9545`; // truffle develop rpc
const dockerNetwork = 'ws://172.18.0.2:8546'; // parity docker container
const web3 = new Web3(new Web3.providers.WebsocketProvider(testEtherium)); // using develop rpc


const zapTokenJson = JSON.parse(fs.readFileSync('../zap/build/contracts/ZapToken.json').toString());
const zapDispatchJson = JSON.parse(fs.readFileSync('../zap/build/contracts/Dispatch.json').toString());
const zapBondageJson = JSON.parse(fs.readFileSync('../zap/build/contracts/Bondage.json').toString());
const zapRegistryJson = JSON.parse(fs.readFileSync('../zap/build/contracts/Registry.json').toString());
const zapArbiterJson = JSON.parse(fs.readFileSync('../zap/build/contracts/Arbiter.json').toString());
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

function getBigNumber(numberOfZeros) {
    let str = '1';
    for (let i = 0; i < numberOfZeros; i++) {
        str += '0';
    }
    return new web3.utils.BN(str);
}

let myProvider;

async function main() {
    const accounts = await web3.eth.getAccounts();

    const owner = accounts[0];
    const oracle = accounts[1];
    const sub = accounts[2];

    console.log('owner: ' + owner);
    console.log('oracle: ' + oracle);
    console.log('sub: ' + sub);

    const testEndpoint = web3.utils.utf8ToHex('test.com');
    console.log('Test endpoint hex = ' + testEndpoint);

    // To use with docker: change network id to 211211
    const zapToken = new web3.eth.Contract(getContractAbi(zapTokenJson), getContractAddress(zapTokenJson, 4447));
    const zapRegistry =  new web3.eth.Contract(getContractAbi(zapRegistryJson), getContractAddress(zapRegistryJson, 4447));
    const zapDispatch = new web3.eth.Contract(getContractAbi(zapDispatchJson), getContractAddress(zapDispatchJson, 4447));
    const zapBondage = new web3.eth.Contract(getContractAbi(zapBondageJson), getContractAddress(zapBondageJson, 4447));
    const zapArbiter = new web3.eth.Contract(getContractAbi(zapArbiterJson), getContractAddress(zapArbiterJson, 4447));

    const registryStorage = new web3.eth.Contract(getContractAbi(registryStorageJson), getContractAddress(registryStorageJson, 4447));


    async function allocateTokens(to, amount) {
        if (await getBalance(to) >= 1000000000000000000000000) return;
        await zapToken.methods.allocate(to, amount).send({from: owner});
        getBalance(to);
    }

    async function getBalance(address) {
        const balance  = await zapToken.methods.balanceOf(address).call();
        console.log('Address ' + address + ' have tokens: ' + balance.valueOf());
        return balance.valueOf();
    }

    async function registerNewDataProvider(publicKey,
                                           title,
                                           endpoint,
                                           endpointParams) {

        let pk = await zapRegistry.methods.getProviderPublicKey(oracle).call({from: oracle});

        if (pk.valueOf() != '0') return;


        console.log('endpoint = ' + endpoint);
        await zapRegistry.methods.initiateProvider(
            new web3.utils.BN('123'),
            web3.utils.utf8ToHex(title),
            endpoint,
            endpointParams)
            .send({from: oracle});

        await zapRegistry.methods.initiateProviderCurve(endpoint, CurveTypes['Linear'], new web3.utils.BN(1), new web3.utils.BN(2)).send({from: oracle});

        //check results
        pk = await zapRegistry.methods.getProviderPublicKey(oracle).call();
        console.log('Received pk of oracle: ' + pk.valueOf());
        if (pk.valueOf() === '0') {
            throw new Error('Public key of provider was not specified!');
        }

        const curve = await zapRegistry.methods.getProviderCurve(oracle, endpoint).call();
        console.log('Inited curve: ' + curve.toString());
    }

    async function bondToDataProvider(oracleAddress,
                                      endpoint,
                                      numZap) {
        console.log('endpoint = ' + endpoint);

         await zapToken.methods.approve(zapBondage._address, getBigNumber(21)).send({from: sub});

         const dots = await zapBondage.methods.getBoundDots(sub, oracle, endpoint).call();
         console.log('dots = ' + dots);

         const res = await zapBondage.methods.calcBondRate(oracle, endpoint, getBigNumber(2)).call();
         console.log(res);

         if (dots != '0') return;

         await zapBondage.methods.bond(oracle, endpoint, new web3.utils.BN(numZap)).send({from: sub, gas: 1000000});

    }

    async function queryData(provider,
                             userQuery,
                             endpoint,
                             endpointParams) {
        const dots = await zapBondage.methods.getBoundDots(sub, provider, endpoint).call({from: sub});
        const dstore = await zapDispatch.methods.storageAddress().call();

        await zapDispatch.methods.query(provider, userQuery, endpoint, endpointParams).send({from: sub, gas: 1000000});
        console.log('Query performed!');
    }
    
    //
    // PROVIDER USAGE
    //
    myProvider = new MyProvider(new ZapDispatch({
        web3: web3,
        contract_address: zapDispatch._address,
        abi: getContractAbi(zapDispatchJson)
    }), new ZapArbiter({
        web3: web3,
        contract_address: zapArbiter._address,
        abi: getContractAbi(zapArbiterJson)
    }));
    const filters = {
        id: '',
        provider: oracle,
        subscriber: ''
    };
    const eventHandler = (incomingEvent) => {
        console.log('Incoming event received!');
        return ['1', '2'];
    };
    const emmiter = myProvider.initQueryRespond(filters, eventHandler, oracle);

    try {
        await allocateTokens(sub, getBigNumber(21));
        await allocateTokens(oracle, getBigNumber(21));

        await registerNewDataProvider(111, 'test', testEndpoint, []);
        await bondToDataProvider(oracle, testEndpoint, getBigNumber(2));

        await queryData(oracle, 'privet', testEndpoint, []);
    } catch (e) {
        emmiter.unsubscribe();
        console.log(e);
        return 1;
    }
    
    emmiter.unsubscribe();
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

