const instanceClass = require('../../src/api/contracts/ZapRegistry');
const ZapWrapper = require('../../src/api/ZapWrapper');
const assert = require("chai").assert;
const {
    ganacheProvider,
    webProvider,
    eth
} = require('../bootstrap');
const { 
    zapRegistryAbi,
    network_id,
    zapRegistryStorageAbi,
    protocol,
    endpoint,
    port
} = require('../../config');
const path = require('path');
const zapRegistryAbiFile = require(path.join(__dirname, '../../src/contracts/abis/ZapRegistry.json'));
const { fromAscii } = require('ethjs');
// const Eth = require('ethjs');
// const endpointTest = `${protocol}${endpoint}:${port}`;
// const eth = new Eth(new Eth.HttpProvider(endpointTest));

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
    let addressZapRegistryStorage;
    let deployedStorage;

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

        const providerTitle = "test";
        const providerPublicKey = 43254352345;
        const ZapCurveType = 'ZapCurveLinear';
        const specifier = "test-specifier";
        const curveStart = 1;
        const curveMultiplier = 2;
        const params = [
            "54B15E68FB8F36D7CD88FF94116CDC1",
            "GMSSEUE3ORHOKWN4WWIQ5X4EBOOTLJY",
            "HQXPYWMACKDWKP47RRVIV7VOURXFE5Q",
            "6029&dn=mediawiki-1.15.1.tar.g"
        ];

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

        it('should bind registry storage', async () => {
            await deployedStorage.transferOwnership(addressZapRegistry, {from: accounts[0], gas: 6000000})
            const data = await deployedStorage.owner({from: accounts[0], gas: 6000000})
            assert.equal(data['0'], addressZapRegistry)
        })

        it('Should initiate provider in zap registry contract', async () => {
            try{
                await zapRegistryWrapper.initiateProvider({
                    public_key: providerPublicKey,
                    title: providerTitle,
                    endpoint_specifier: specifier.valueOf(),
                    endpoint_params: [],
                    from: accounts[0],
                    gas: 600000
                });
                const title = await zapRegistryWrapper.contract.getProviderTitle(accounts[0]);
                if (~title['0'].indexOf(providerTitle)) {
                    assert.ok(true)
                } else {
                    assert.ok(false)
                };
            } catch(err) {
                console.log(err)
                throw err
            }
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
        // specifier, newParams, { from: owner }
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