const Registry = require('../../src/api/contracts/Registry');
const Web3 = require('web3');
const assert = require("chai").assert;
const fs = require('fs');
const { migrateContracts, ganacheProvider, ganacheServer} = require('../bootstrap');
const {ganacheNetwork} = require('../../config');
const path = require('path');
const {
    curve,
    providerTitle,
    providerPublicKey,
    specifier,
    params
} = require('../utils');

const currentNetwork = ganacheNetwork;
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://127.0.0.1:7545'));


async function configureEnvironment(func) {
    await func();
}

describe('Registry', function () {
    let accounts = [];
    let addressZapRegistry;
    let abiJSON;
    let zapRegistryWrapper;
    let addressZapRegistryStorage;
    let deployedStorage;
    let abiJSONStorage;

    before(function (done) {
        configureEnvironment(async () => {
            await migrateContracts();
            accounts = await web3.eth.getAccounts();
            console.log(path.join(__dirname, '../../ZapContracts/build/contracts/Registry.json'));
            abiJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '../../ZapContracts/build/contracts/Registry.json')));
            abiJSONStorage = JSON.parse(fs.readFileSync(path.join(__dirname, '../../ZapContracts/build/contracts/RegistryStorage.json')));
            addressZapRegistry = abiJSON.networks[currentNetwork.id].address;
            addressZapRegistryStorage = abiJSONStorage.networks[currentNetwork.id].address;
            deployedStorage = new web3.eth.Contract(abiJSONStorage.abi, addressZapRegistryStorage);
            zapRegistryWrapper = new Registry({
                provider: web3.currentProvider,
                address: addressZapRegistry,
                artifact: abiJSON
            });
            console.log('before function is done');
            done();
        });
    });

    it('should check bind registry storage', async () => {
        const data = await deployedStorage.methods.owner().call();
        assert.equal(data, addressZapRegistry);
    });

    it('Should initiate provider in zap registry contract', async () => {
        await zapRegistryWrapper.initiateProvider({
            public_key: providerPublicKey,
            title: providerTitle,
            endpoint_specifier: specifier.valueOf(),
            endpoint_params: [],
            from: accounts[0],
            gas: 600000
        });
        const title = await zapRegistryWrapper.contract.getProviderTitle(accounts[0]);
        if (~title['0'].indexOf(fromAscii(providerTitle))) {
            assert.ok(true);
        } else {
            assert.ok(false);
        }
    });

    it('Should initiate Provider curve in zap registry contract', async () => {
        await zapRegistryWrapper.initiateProviderCurve({
            specifier,
            curve,
            from: accounts[0],
            gas: 300000
        });
        const curve = await zapRegistryWrapper.contract.getProviderCurve(accounts[0], fromAscii(specifier.valueOf()));
        await expect(Utils.fetchPureArray(curve[0], parseInt)).to.deep.equal(curve.constants);
        await expect(Utils.fetchPureArray(curve[1], parseInt)).to.deep.equal(curve.parts);
        await expect(Utils.fetchPureArray(curve[2], parseInt)).to.deep.equal(curve.dividers);
    });

    it('Should set endpoint params in zap registry contract', async () => {
        await zapRegistryWrapper.setEndpointParams({
            specifier: specifier.valueOf(),
            params,
            from: accounts[0],
            gas: 300000
        });
        const endpointsSize = await deployedStorage.getEndpointIndexSize(
            accounts[0],
            fromAscii(specifier.valueOf())
        );
        assert.equal(endpointsSize['0'].toNumber(), params.length);
    });

    it('Should get oracle in zap registry contract', async () => {
        const oracle = await zapRegistryWrapper.getOracle({
            address: accounts[0],
            specifier: specifier.valueOf()
        });
        assert.equal(oracle.public_key['0'].toString(), providerPublicKey);
        assert.equal(oracle.endpoint_params.length, params.length);
    });
});
