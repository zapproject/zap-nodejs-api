const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const https = require('https');
const TruffleContract = require("truffle-contract");
const HttpsProvider = require('../src/api/HttpsProvider');
const TestAuthHandler = require('../src/api/TestAuthHandler');
const ZapDispatch = require('../src/api/contracts/Dispatch');
const ZapArbiter = require('../src/api/contracts/Arbiter');

const testNetwork = {
    address: `ws://127.0.0.1:9545`, // truffle develop rpc
    id: 4447
};
const dockerNetwork = {
    address: 'ws://172.18.0.2:8546', // parity docker container
    id: 211211
};
const web3 = new Web3(new Web3.providers.WebsocketProvider(testNetwork.address)); // using develop rpc


const zapTokenJson = JSON.parse(fs.readFileSync('../../zap/build/contracts/ZapToken.json').toString());
const zapDispatchJson = JSON.parse(fs.readFileSync('../../zap/build/contracts/Dispatch.json').toString());
const zapBondageJson = JSON.parse(fs.readFileSync('../../zap/build/contracts/Bondage.json').toString());
const zapRegistryJson = JSON.parse(fs.readFileSync('../../zap/build/contracts/Registry.json').toString());
const zapArbiterJson = JSON.parse(fs.readFileSync('../../zap/build/contracts/Arbiter.json').toString());
const registryStorageJson = JSON.parse(fs.readFileSync('../../zap/build/contracts/RegistryStorage.json').toString());

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

function getPowOfTenBN(numberOfZeros) {
    let str = '1';
    for (let i = 0; i < numberOfZeros; i++) {
        str += '0';
    }
    return new web3.utils.BN(str);
}

async function main() {
    const accounts = await web3.eth.getAccounts();

    const owner = accounts[0];
    const oracle = accounts[1];
    const sub = accounts[2];

    console.log('owner: ' + owner);
    console.log('oracle: ' + oracle);
    console.log('sub: ' + sub);

    const testEndpoint = 'test.com';
    console.log('Test endpoint hex = ' + testEndpoint);

    const zapToken = new web3.eth.Contract(getContractAbi(zapTokenJson), getContractAddress(zapTokenJson, testNetwork.id));
    const zapRegistry = new web3.eth.Contract(getContractAbi(zapRegistryJson), getContractAddress(zapRegistryJson, testNetwork.id));
    const zapDispatch = new web3.eth.Contract(getContractAbi(zapDispatchJson), getContractAddress(zapDispatchJson, testNetwork.id));
    const zapBondage = new web3.eth.Contract(getContractAbi(zapBondageJson), getContractAddress(zapBondageJson, testNetwork.id));
    const zapArbiter = new web3.eth.Contract(getContractAbi(zapArbiterJson), getContractAddress(zapArbiterJson, testNetwork.id));

    const registryStorage = new web3.eth.Contract(getContractAbi(registryStorageJson), getContractAddress(registryStorageJson, testNetwork.id));


    async function allocateTokens(to, amount) {
        if (getPowOfTenBN(21).lte(await getBalance(to))) return;
        await zapToken.methods.allocate(to, amount).send({from: owner});
        getBalance(to);
    }

    async function getBalance(address) {
        const balance  = await zapToken.methods.balanceOf(address).call();
        console.log('Address ' + address + ' have tokens: ' + balance.valueOf());
        return balance.valueOf();
    }

    async function registerNewDataProvider(title,
                                           endpoint,
                                           endpointParams) {

        let pk = await zapRegistry.methods.getProviderPublicKey(oracle).call({from: oracle});

        if (pk.valueOf() != '0') return;


        console.log('endpoint = ' + endpoint);
        await zapRegistry.methods.initiateProvider(
            new web3.utils.BN('123'),
            web3.utils.utf8ToHex(title),
            web3.utils.utf8ToHex(endpoint),
            endpointParams)
            .send({from: oracle, gas: 1000000});

        await zapRegistry.methods.initiateProviderCurve(web3.utils.utf8ToHex(endpoint),
            CurveTypes['Linear'],
            new web3.utils.BN(1),
            new web3.utils.BN(2))
            .send({from: oracle, gas: 1000000});

        //check results
        pk = await zapRegistry.methods.getProviderPublicKey(oracle).call();
        console.log('Received pk of oracle: ' + pk.valueOf());
        if (pk.valueOf() === '0') {
            throw new Error('Public key of provider was not specified!');
        }

        const curve = await zapRegistry.methods.getProviderCurve(oracle, web3.utils.utf8ToHex(endpoint)).call();
        console.log('Inited curve: ' + JSON.stringify(curve));
    }

    async function bondToDataProvider(oracleAddress,
                                      endpoint,
                                      numZap) {
        console.log('endpoint = ' + endpoint);

        const dots = await zapBondage.methods.getBoundDots(sub, oracle, web3.utils.utf8ToHex(endpoint)).call();
        console.log('dots = ' + dots);

        if (dots != '0') return;

        await zapToken.methods.approve(zapBondage._address, getPowOfTenBN(21)).send({from: sub});
        await zapBondage.methods.bond(oracle, web3.utils.utf8ToHex(endpoint), new web3.utils.BN(numZap)).send({from: sub, gas: 1000000});
    }

    async function queryData(provider,
                             userQuery,
                             endpoint,
                             endpointParams) {
        await zapDispatch.methods.query(provider, userQuery, web3.utils.utf8ToHex(endpoint), endpointParams).send({from: sub, gas: 1000000});
        console.log('Query performed!');
    }

    //
    // HTTPS PROVIDER USAGE
    //
    let httpsOptions = {
        baseUrl: 'https://jsonplaceholder.typicode.com',
        port: 443,
        method: 'GET',
        headers: {},
        path: 'posts/1',
        agent: new https.Agent({
            ca: '', //fs.readFileSync(`CA.pem`),
            cert: '', //fs.readFileSync(`CERT.pem`),
            key: ''//fs.readFileSync(`KEY.pem`)
        })
    };
    let myAuthHandler = new TestAuthHandler();
    let myProvider = new HttpsProvider(new ZapDispatch({
        web3: web3,
        contract_address: zapDispatch._address,
        abi: getContractAbi(zapDispatchJson)
    }), new ZapArbiter({
        web3: web3,
        contract_address: zapArbiter._address,
        abi: getContractAbi(zapArbiterJson)
    }), 123, httpsOptions, myAuthHandler);
    const filters = {
        id: '',
        provider: oracle,
        subscriber: '',
        fromBlock: 0
    };
    const responseParser = (response) => {
        if (response.status !== 200) throw Error('Response received with status ' + response.status + ' ' + response.data);
        const responseData = response.data;
        console.log('Received response: ' + JSON.stringify(responseData));

        // return values must be strings
        // up to 4 values
        return [responseData.userId.toString(), responseData.id.toString()];
    };

    // You will have 'revert' exception when event will caught, because sub is not contract address that implement Client2
    const emmiter = myProvider.initQueryRespond(responseParser, filters, oracle);

    try {
        await allocateTokens(sub, getPowOfTenBN(21));
        await allocateTokens(oracle, getPowOfTenBN(21));

        await registerNewDataProvider('test', testEndpoint, []);
        await bondToDataProvider(oracle, testEndpoint, getPowOfTenBN(2));

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
    console.log('\n\nExecuted with result code: ' + res);
});

