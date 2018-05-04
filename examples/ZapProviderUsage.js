const Eth = require('ethjs'); // ethereum utils lib
const web3 = require('web3');
const fs = require('fs');
const path = require('path');
const ZapDispatch = require('../src/api/contracts/ZapDispatch');
const ZapBondage = require('../src/api/contracts/ZapBondage');
const ZapToken = require('../src/api/contracts/ZapToken');

const testEtherium = `http://127.0.0.1:9545`; // truffle develop rpc
const eth = new Eth(new Eth.HttpProvider(testEtherium)); // using develop rpc

const abiZapToken = fs.readFileSync('../ZapContracts/build/contracts/ZapToken.json');


async function main() {
    const accounts = await eth.accounts();

    const owner = accounts[0];
    const oracle = accounts[1];
    const sub = accounts[2];

    console.log('owner: ' + owner);
    console.log('oracle: ' + oracle);
    console.log('sub: ' + sub);

    const testEndpoint = 'http://test.com/api/tst';

    const zapToken = new ZapToken({eth, contract_address:'0x13274fe19c0178208bcbee397af8167a7be27f6f', abiFile:abiZapToken});
    const zapDispatch = new ZapDispatch({eth, contract_address:'', abiFile:0});
    const zapBondage = new ZapBondage({eth, contract_address:'', abiFile:0});

    async function giveZap(to, amount) {
        await zapToken.send({to, amount, owner});
    }

    async function registerNewDataProvider(publicKey,
                                           title,
                                           endpoint,
                                           endpointParams) {

    }

    async function subscribeToDataProvider(oracleAddress,
                                           endpoint,
                                           numZap) {

    }

    async function queryData(provider,
                             userQuery,
                             endpoint,
                             endpointParams) {

    }

    async function initProvider() {

    }




    await giveZap(owner, sub, 100000);
    await giveZap(owner, oracle, 100000);

    await registerNewDataProvider(oracle, 'some_public_key', 'test', testEndpoint, []);
    await subscribeToDataProvider(sub, oracle, testEndpoint, 100000);

    await initProvider();

    for (let i = 0; i < 100; i++) {
        await queryData(sub, oracle, 'privet ' + i, testEndpoint, [])
    }

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
