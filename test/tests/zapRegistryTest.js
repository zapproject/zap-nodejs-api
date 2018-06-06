const instanceClass = require('../../src/api/contracts/ZapRegistry');
const ZapWrapper = require('../../src/api/ZapWrapper');
const assert = require("chai").assert;
const Curve = require('../src/api/components/Curve');
const {
    webProvider,
    eth
} = require('../bootstrap');
const {
    zapRegistryAbi,
    network_id,
    zapRegistryStorageAbi
} = require('../../config');
const path = require('path');
// const zapRegistryAbiFile = require(path.join(__dirname, '../../src/contracts/abis/ZapRegistry.json'));
const { fromAscii } = require('ethjs');
const {
    curveType,
    providerTitle,
    providerPublicKey,
    ZapCurveType,
    specifier,
    curveStart,
    curveMultiplier,
    params
} = require('../utils');


describe('ZapRegistry, path to "/src/api/contracts/ZapRegistry"', () => {
    let addressZapRegistry;
    let accounts = [];
    let deployedZapRegistry;
    let zapRegistry;
    let abiJSON;
    let zapRegistryWrapper;
    let addressZapRegistryStorage;
    let deployedStorage;
    let abiJSONStorage;

    before(async () => {
        abiJSON = require(path.join(__dirname, zapRegistryAbi));
        abiJSONStorage = require(path.join(__dirname, zapRegistryStorageAbi));
        addressZapRegistry = abiJSON.networks[network_id].address;
        addressZapRegistryStorage = abiJSONStorage.networks[network_id].address;
        deployedZapRegistry = eth.contract(abiJSON.abi).at(addressZapRegistry);
        deployedStorage = eth.contract(abiJSONStorage.abi).at(addressZapRegistryStorage);
        accounts = await webProvider.eth.getAccounts();
        assert.ok(true);
    });

    describe('ZapRegistryWrapper', function () {

        beforeEach((done) => {
            setTimeout(() => done(), 500);
        });

        it('Should initiate zapRegistry wrapper', async () => {
            const wrapper = new ZapWrapper(eth);
            zapRegistryWrapper = wrapper.initClass({
                instanceClass,
                address: addressZapRegistry,
                abiPath: abiJSON.abi
            });
        });

        it('should check bind registry storage', async () => {
            const data = await deployedStorage.owner({ from: accounts[0], gas: 6000000 });
            assert.equal(data['0'], addressZapRegistry);
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
            let c = new Curve([2, 2, 0, 1, 1, 1, 10, 0, 0], [0, 5, 5, 10], [1, 3]);
            await zapRegistryWrapper.initiateProviderCurve({
                specifier,
                c,
                from: accounts[0],
                gas: 300000
            });
            const curve = await zapRegistryWrapper.contract.getProviderCurve(accounts[0], fromAscii(specifier.valueOf()));
            await expect(Utils.fetchPureArray(curve[0],parseInt)).to.deep.equal(c.constants);
            await expect(Utils.fetchPureArray(curve[1],parseInt)).to.deep.equal(c.parts);
            await expect(Utils.fetchPureArray(curve[2],parseInt)).to.deep.equal(c.dividers);
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
});