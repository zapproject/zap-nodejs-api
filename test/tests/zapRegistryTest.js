const instanceClass = require('../../src/api/contracts/ZapRegistry');
const assert = require("chai").assert;
const {
    migrateContracts,
    ganacheProvider,
    webProvider
} = require('../bootstrap');
const { 
    zapRegistryAbi,
    port,
    protocol,
    endpoint
} = require('../../config');
const contract = require('truffle-contract');
const path = require('path');
const Eth = require('ethjs');
const endpointTest = `${protocol}${endpoint}:${port}`;
const eth = new Eth(new Eth.HttpProvider(endpointTest));
const ZapWrapper = require('../../src/api/ZapWrapper');

describe('ZapRegistry, path to "/src/api/contracts/ZapRegistry"', () => {
    let addressZapRegistry;
    let accounts = [];
    let deployedZapRegistry;
    let zapRegistry;
    let abiJSON;
    let zapRegistryWrapper;

    before(async () => {
        abiJSON = require(path.join(__dirname, zapRegistryAbi));
        zapRegistry = contract(abiJSON);
        zapRegistry.setProvider(ganacheProvider);
        deployedZapRegistry = await zapRegistry.deployed();
        addressZapRegistry = deployedZapRegistry.address;
        accounts = await webProvider.eth.getAccounts();
        assert.ok(true);
    });

    describe('ZapRegistryWrapper', function () {

        it('Should initiate zapRegistry wrapper', async () => {
            const wrapper = new ZapWrapper(eth);
            zapRegistryWrapper = wrapper.initClass({
                instanceClass,
                address: addressZapRegistry,
                abiPath: abiJSON.abi
            });
        });

        it('Should initiate provider in zap registry contract', async () => {
            await zapRegistryWrapper.initiateProvider({
                publicKey: 111,
                route_keys: [1],
                title: 'test',
                from: accounts[0]
            });
        });

        it('Should initiate Provider curve in zap registry contract', async () => {
            await zapRegistryWrapper.initiateProviderCurve({
                specifier: '0xb5ba53bc5ca7cdd6c97be54f7d4e82a5d923be7665deef14398f34a108fb3b89',
                ZapCurveType: 'ZapCurveNone',
                curveStart: 1,
                curveMultiplier: 2,
                from: accounts[0]
            });
        });
    });
});