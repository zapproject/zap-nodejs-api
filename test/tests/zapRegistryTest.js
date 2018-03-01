const instanceClass = require('../../src/api/contracts/ZapRegistry');
const assert = require("chai").assert;
const {
    ganacheProvider,
    webProvider
} = require('../bootstrap');
const { 
    zapRegistryAbi,
    port,
    protocol,
    endpoint,
    network_id
} = require('../../config');
const contract = require('truffle-contract');
const path = require('path');
const Eth = require('ethjs');
const endpointTest = `${protocol}${endpoint}:${port}`;
const eth = new Eth(new Eth.HttpProvider(endpointTest));
const ZapWrapper = require('../../src/api/ZapWrapper');
const zapRegistryAbiFile = require(path.join(__dirname, '../../src/contracts/abis/ZapRegistry.json'));
const { fromAscii } = require('ethjs');

const specifier = new String("test-linear-specifier");

const curveType = {
    "ZapCurveNone": 0,
    "ZapCurveLinear": 1,
    "ZapCurveExponential": 2,
    "ZapCurveLogarithmic": 3
};

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
        zapRegistry.setNetwork(network_id);
        deployedZapRegistry = await zapRegistry.deployed();
        addressZapRegistry = zapRegistry.address;
        accounts = await webProvider.eth.getAccounts();
        assert.ok(true);
    });

    describe('ZapRegistryWrapper', function () {

        const providerTitle = "test";
        const providerPublicKey = 43254352345;
        const ZapCurveType = 'ZapCurveLinear';
        const curveStart = 1;
        const curveMultiplier = 2;
        const params = [
            "54B15E68FB8F36D7CD88FF94116CDC1",
            "GMSSEUE3ORHOKWN4WWIQ5X4EBOOTLJY",
            "HQXPYWMACKDWKP47RRVIV7VOURXFE5Q",
            "6029&dn=mediawiki-1.15.1.tar.g"
        ];

        beforeEach(function(done) {
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

        it('Should initiate provider in zap registry contract', async () => {
            await zapRegistryWrapper.initiateProvider({
                public_key: providerPublicKey,
                title: providerTitle,
                endpoint_specifier: specifier.valueOf(),
                endpoint_params: [],
                from: accounts[0],
                gas: 300000
            });
            const title = await zapRegistryWrapper.contract.getProviderTitle(accounts[0]);
            assert.equal(title['0'], providerTitle);
        });

        it('Should initiate Provider curve in zap registry contract', async () => {
            await zapRegistryWrapper.initiateProviderCurve({
                specifier: specifier.valueOf(),
                ZapCurveType,
                curveStart,
                curveMultiplier,
                from: accounts[0],
                gas: 300000
            });
            const provider = await zapRegistryWrapper.contract.getProviderCurve(accounts[0], fromAscii(specifier.valueOf()));
            assert.equal(provider.curveType.toString(), curveType[ZapCurveType]);
            assert.equal(provider.curveStart.toString(), curveStart);
            assert.equal(provider.curveMultiplier.toString(), curveMultiplier);
        });
        
        it('Should set endpoint params in zap registry contract', async () => {
            await zapRegistryWrapper.setEndpointParams({ 
                specifier: specifier.valueOf(), 
                params, 
                from: accounts[0],
                gas: 300000
            });
            const endpointParams = await zapRegistryWrapper.contract.getProviderRouteKeys(
                accounts[0], 
                fromAscii(specifier.valueOf())
            );
            assert.equal(endpointParams['0'].length, params.length);
        });

        it('Should ger oracle in zap registry contract', async () => {
            const oracle = await zapRegistryWrapper.getOracle({
                address: accounts[0],
                specifier: specifier.valueOf()
            });
            assert.equal(oracle.public_key['0'].toString(), providerPublicKey);
            assert.equal(oracle.endpoint_params['0'].length, params.length);
        }); 
    });
});