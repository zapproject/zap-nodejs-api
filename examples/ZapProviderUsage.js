const fs = require('fs');
const Provider = require('../src/api/components/Provider');
const Handler = require('../src/api/components/Handler');
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

function getPowOfTenBN(numberOfZeros) {
    let str = '1';
    for (let i = 0; i < numberOfZeros; i++) {
        str += '0';
    }
    return new web3.utils.BN(str);
}



async function executePreQueryFlow(web3, zapRegistry, zapToken, zapBondage, sub, oracle, owner, providerEndpoint, providerTitle) {
    let subBalance = (await zapToken.methods.balanceOf(sub).call()).valueOf();
    if (!getPowOfTenBN(21).lte(subBalance)) {
        await zapToken.methods.allocate(sub, getPowOfTenBN(21)).send({from: owner});
        subBalance = (await zapToken.methods.balanceOf(sub).call()).valueOf();
        console.log('Address ' + sub + ' have tokens: ' + subBalance.valueOf());
    }

    let oracleBalance = (await zapToken.methods.balanceOf(oracle).call()).valueOf();
    if (!getPowOfTenBN(21).lte(oracleBalance)) {
        await zapToken.methods.allocate(oracle, getPowOfTenBN(21)).send({from: owner});
        oracleBalance = (await zapToken.methods.balanceOf(oracle).call()).valueOf();
        console.log('Address ' + oracle + ' have tokens: ' + oracleBalance.valueOf());
    }

    let pk = await zapRegistry.methods.getProviderPublicKey(oracle).call({from: oracle});

    if (pk.valueOf() == '0') {
        console.log('endpoint = ' + providerEndpoint);
        await zapRegistry.methods.initiateProvider(
            new web3.utils.BN('123'),
            web3.utils.utf8ToHex(providerTitle),
            web3.utils.utf8ToHex(providerEndpoint),
            [])
            .send({from: oracle, gas: 1000000});

        await zapRegistry.methods.initiateProviderCurve(web3.utils.utf8ToHex(providerEndpoint),
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

        const curve = await zapRegistry.methods.getProviderCurve(oracle, web3.utils.utf8ToHex(providerEndpoint)).call();
        console.log('Inited curve: ' + JSON.stringify(curve));
    }

    console.log('endpoint = ' + providerEndpoint);

    const dots = await zapBondage.methods.getBoundDots(sub, oracle, web3.utils.utf8ToHex(providerEndpoint)).call();
    console.log('dots = ' + dots);

    if (dots == '0') {
        await zapToken.methods.approve(zapBondage._address, getPowOfTenBN(21)).send({from: sub});
        await zapBondage.methods.bond(oracle, web3.utils.utf8ToHex(providerEndpoint), new web3.utils.BN(getPowOfTenBN(2))).send({
            from: sub,
            gas: 1000000
        });
    }
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


    async function queryData(provider,
                             userQuery,
                             endpoint,
                             endpointParams) {
        await zapDispatch.methods.query(provider, userQuery, web3.utils.utf8ToHex(endpoint), endpointParams).send({from: sub, gas: 1000000});
        console.log('Query performed!');
    }
    
    //
    // PROVIDER USAGE
    //

    let myHandler = new class MyHandler extends Handler {
        async handleSubscription(event) {
            return new Error("Not implemented yet");
        }

        async handleUnsubscription(event) {
            return new Error("Not implemented yet");
        }

        async handleIncoming(event) {
            console.log('Incoming event received!');
            return ['1', '2'];
        }
    }();

    let myProvider = new Provider(new ZapDispatch({
        provider: new Web3.providers.WebsocketProvider(testNetwork.address),
        address: zapDispatch._address,
        artifact: zapDispatchJson
    }), new ZapArbiter({
        provider: new Web3.providers.WebsocketProvider(testNetwork.address),
        address: zapArbiter._address,
        artifact: zapArbiterJson
    }), myHandler);
    const filters = {
        id: '',
        provider: oracle,
        subscriber: '',
        fromBlock: 0
    };

    // You will have 'revert' exception when event will cought, because sub is not contract address that implement Client2
    const emmiter = myProvider.listenQueries(filters, oracle);

    try {
        await executePreQueryFlow(web3, zapRegistry, zapToken, zapBondage, sub, oracle, owner, testEndpoint);
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

