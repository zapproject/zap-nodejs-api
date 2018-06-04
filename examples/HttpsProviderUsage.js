const fs = require('fs');
const Web3 = require('web3');
const https = require('https');
const Provider = require('../src/api/components/Provider');
const HttpsHandler = require('../src/api/handlers/HttpsHandler').HttpsHandler;
const HttpsResponseParser = require('../src/api/handlers/HttpsHandler').Parser;
const Auth = require('../src/api/handlers/HttpsHandler').Auth;
const ZapDispatch = require('../src/api/contracts/Dispatch');
const ZapArbiter = require('../src/api/contracts/Arbiter');
const Curve = require('../src/api/components/Curve');

const testNetwork = {
    address: `ws://127.0.0.1:9545`, // truffle develop rpc
    id: 4447
};
const dockerNetwork = {
    address: 'ws://127.0.0.1:8546', // parity docker container
    id: 211211
};

const currentNetwork = dockerNetwork;

// Init websocket provider for listening events (HttpProvider is deprecated);
const web3 = new Web3(new Web3.providers.WebsocketProvider(currentNetwork.address)); // using develop rpc

// Truffle artifacts
const zapTokenJson = JSON.parse(fs.readFileSync('./ZapContracts/build/contracts/ZapToken.json'));
const zapDispatchJson = JSON.parse(fs.readFileSync('./ZapContracts/build/contracts/Dispatch.json'));
const zapBondageJson = JSON.parse(fs.readFileSync('./ZapContracts/build/contracts/Bondage.json'));
const zapRegistryJson = JSON.parse(fs.readFileSync('./ZapContracts/build/contracts/Registry.json'));
const zapArbiterJson = JSON.parse(fs.readFileSync('./ZapContracts/build/contracts/Arbiter.json'));
const registryStorageJson = JSON.parse(fs.readFileSync('./ZapContracts/build/contracts/RegistryStorage.json'));


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

/**
 * Get 10^n as Big Number
 *
 * @param numberOfZeros power of ten
 * @returns {web3.utils.BN} big number that is 10^numberOfZeros
 */
function getPowOfTenBN(numberOfZeros) {
    let str = '1';
    for (let i = 0; i < numberOfZeros; i++) {
        str += '0';
    }
    return new web3.utils.BN(str);
}


/**
 * Using Web3 for initialize start state of contracts to be prepared to use query() function of Dispatch contract
 * Should be called only if using test network without configured contracts
 *
 * @param web3 instance of web3 with specified provider
 * @param zapRegistry Web3 instance of Registry contract
 * @param zapToken Web3 instance of ZapToken contract
 * @param zapBondage Web3 instance of Bondage contract
 * @param sub address of subscriber that will request data from provider
 * @param oracle provider address
 * @param owner contracts owner address
 * @param providerEndpoint endpoint for data subscriber data requests
 * @param providerTitle provider title
 * @param providerPublicKey public key of provider in Registry contract
 *
 * @returns {Promise<void>} async function
 */
async function executePreQueryFlow(web3, zapRegistry, zapToken, zapBondage, sub, oracle, owner, providerEndpoint, providerTitle, providerPublicKey) {
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
            new web3.utils.BN(providerPublicKey),
            web3.utils.utf8ToHex(providerTitle),
            web3.utils.utf8ToHex(providerEndpoint),
            [])
            .send({from: oracle, gas: 1000000});

        let c = new Curve([2, 2, 0, 1, 1, 1, 10, 0, 0], [0, 5, 5, 10], [1, 3]);
        await zapRegistry.methods.initiateProviderCurve(web3.utils.utf8ToHex(providerEndpoint), c.constants, c.parts, c.dividers)
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

/**
 * Main function that perform configuration flow and calling query to receive Incoming event
 *
 * @returns {Promise<number>} result code
 */
async function main() {
    // get accounts from test network
    const accounts = await web3.eth.getAccounts();

    const owner = accounts[0];
    const oracle = accounts[1];
    const sub = accounts[2];

    console.log('owner: ' + owner);
    console.log('oracle: ' + oracle);
    console.log('sub: ' + sub);

    const testEndpoint = 'test.com';
    const providerPublicKey = 123;

    // creating web3 contract instances
    const zapToken = new web3.eth.Contract(getContractAbi(zapTokenJson), getContractAddress(zapTokenJson, currentNetwork.id));
    const zapRegistry = new web3.eth.Contract(getContractAbi(zapRegistryJson), getContractAddress(zapRegistryJson, currentNetwork.id));
    const zapDispatch = new web3.eth.Contract(getContractAbi(zapDispatchJson), getContractAddress(zapDispatchJson, currentNetwork.id));
    const zapBondage = new web3.eth.Contract(getContractAbi(zapBondageJson), getContractAddress(zapBondageJson, currentNetwork.id));
    const zapArbiter = new web3.eth.Contract(getContractAbi(zapArbiterJson), getContractAddress(zapArbiterJson, currentNetwork.id));


    // Call query function of Dispatch contract to request data from provider
    async function queryData(provider,
                             userQuery,
                             endpoint,
                             endpointParams,
                             onChain) {
        await zapDispatch.methods.query(provider, userQuery, web3.utils.utf8ToHex(endpoint), endpointParams, onChain).send({from: sub, gas: 1000000});
        console.log('Query performed!');
    }

    //
    // HTTPS PROVIDER USAGE
    //

    // options for https handler
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

    // handler response parser
    // return value of parseIncomingResponse will be used as params for Dispatch.respond() function
    let parser = new class MyParser extends HttpsResponseParser {
        parseIncomingResponse(response) {
            if (response.status !== 200) throw Error('Response received with status ' + response.status + ' ' + response.data);

            const responseData = response.data;
            console.log('Received response: ' + JSON.stringify(responseData));

            // return values must be strings
            // up to 4 values
            return [responseData.userId.toString(), responseData.id.toString()];
        }
    }();

    const awsCredentials = {
        accessKeyId: 'access_key_id',
        secretAccessKey: 'secret_access_key',
        region: 'eu-west-1'
    };

    // Init provider with https handler
    let myProvider = new Provider(new ZapDispatch({
            provider: web3.currentProvider,
            address: zapDispatch._address,
            artifact: zapDispatchJson
        }), new ZapArbiter({
            provider: web3.currentProvider,
            address: zapArbiter._address,
            artifact: zapArbiterJson
        }),
        // Using default Auth class, because authorization not needed
        // You should implement your own Auth and Parser
        // also you should specify aws credentials for tls notary in Auth constructor
        new HttpsHandler(providerPublicKey, httpsOptions, parser, new Auth(awsCredentials))
    );

    // Specifying filters for Incoming event
    // Catch only events with our provider == oracle
    // events with different provider will be ignored
    const filters = {
        provider: oracle,
        fromBlock: 0
    };

    // You will have 'revert' exception when event will caught, because sub is not contract address that implement Client2
    const event = await myProvider.listenQueries(filters, oracle);

    // execute query to receive Incoming event
    try {
        await executePreQueryFlow(web3, zapRegistry, zapToken, zapBondage, sub, oracle, owner, testEndpoint, 'title', providerPublicKey);
        await queryData(oracle, 'hello', testEndpoint, [], false);
    } catch (e) {
        console.log(e);
        return {
            resultCode: 1,
            event: event
        };
    }

    return {
        resultCode: 0,
        event: event
    };
}

/**
 * ENTRY POINT
 */
main().then((res) => {
    console.log('\n\nExecuted with result code: ' + res.resultCode);
});



