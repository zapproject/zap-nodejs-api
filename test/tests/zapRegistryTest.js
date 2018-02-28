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
    endpoint
} = require('../../config');
const contract = require('truffle-contract');
const path = require('path');
const Eth = require('ethjs');
const endpointTest = `${protocol}${endpoint}:${port}`;
const eth = new Eth(new Eth.HttpProvider(endpointTest));
const ZapWrapper = require('../../src/api/ZapWrapper');
const zapRegistryAbiFile = require(path.join(__dirname, '../../src/contracts/abis/ZapRegistry.json'));

const specifier = new String("test-linear-specifier");

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
                public_key: 43254352345,
                title: 'test',
                endpoint_specifier: specifier.valueOf(),
                endpoint_params: [],
                from: accounts[0]
            });
        });

        it('Should initiate Provider curve in zap registry contract', async () => {
            await zapRegistryWrapper.initiateProviderCurve({
                specifier: specifier.valueOf(),
                ZapCurveType: 'ZapCurveLinear',
                curveStart: 1,
                curveMultiplier: 2,
                from: accounts[0]
            });
        });
        
        it('Should set endpoint params in zap registry contract', async () => {
            try {
                await zapRegistryWrapper.setEndpointParams({ 
                    specifier: specifier.valueOf(), 
                    params: [
                        '54B15E68FB8F36D7CD88FF94116CDC1',
                        'GMSSEUE3ORHOKWN4WWIQ5X4EBOOTLJY',
                        'HQXPYWMACKDWKP47RRVIV7VOURXFE5Q',
                        '6029&dn=mediawiki-1.15.1.tar.gz'
                    ], 
                    from: accounts[0]
                });
            } catch(err) {
                throw err;
                // if (err.value && err.value.message && ~err.value.message.indexOf('invalid opcode')) {
                //     assert.ok(true);
                // } else {
                    
                // }
            }
        });

        // it('Should ger oracle in zap registry contract', async () => {
        //     try {
        //         const oracle = await zapRegistryWrapper.getOracle( accounts[0] );
        //         console.log(oracle);
        //     } catch(err) {
        //         console.log('err===>>>>>',err);
        //     }
        // }); 
    });
});