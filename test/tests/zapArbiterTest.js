const instanceClass = require('../../src/api/contracts/ZapArbiter');
const ZapWrapper = require('../../src/api/ZapWrapper');
const assert = require("chai").assert;
const {
    webProvider,
    eth
} = require('../bootstrap');
const {
    zapArbiterAbi,
    zapTokenAbi,
    zapRegistryAbi,
    zapBondageAbi,
    arbiterStorageAbi,
    zapRegistryStorageAbi,
    bondageStorageAbi,
    currentCostAbi,
    addressSpacePointerAbi
} = require('../../config');
const path = require('path');
const { fromAscii, toBN } = require('ethjs');
const BigNumber = require('bignumber.js');
const {
    getNewArbiterContract,
    getNewBondageContract,
    getNewSmartContract,
    getNewRegistryContract,
    curveType,
    providerTitle,
    providerPublicKey,
    ZapCurveType,
    curveStart,
    curveMultiplier,
    params,
    getNewCurrentCostContract,
    oracleEndpoint,
    tokensForOracle,
    tokensForOwner,
    gasTransaction,
    getInstanceOfSmartContract
} = require('../utils');


describe('Arbiter, path to "/src/api/contracts/ZapArbiter"', () => {
    let addressZapArbiter;
    let accounts = [];
    let deployedZapArbiter;
    let deployedZapToken;
    let deployedZapRegistry;
    let deployedZapBondage;
    let zapArbiter;
    let arbiterAbi;
    let zapArbiterWrapper;
    let arbiterStorage;
    let bondageStorage;
    let registryStorage;
    let currentCostStorage;

    before(async () => {

        accounts = await webProvider.eth.getAccounts();
        assert.ok(true);
        
    });

    describe('ZapArbiterWrapper', function () {

        beforeEach(function (done) {
            setTimeout(() => done(), 500);
        });

        it('should get instances of smart contracts, their storages and bind owners', async function() {
            try {
                arbiterAbi = require(path.join(__dirname, zapArbiterAbi));
                let tokenAbi = require(path.join(__dirname, zapTokenAbi));
                let registryAbi = require(path.join(__dirname, zapRegistryAbi));
                let bondageAbi = require(path.join(__dirname, zapBondageAbi));
                
                const spacePointer = getInstanceOfSmartContract(
                    require(path.join(__dirname, addressSpacePointerAbi ))
                );

                [
                    bondageStorage,
                    registryStorage,
                    arbiterStorage,
                    deployedZapToken
                ] = await Promise.all([
                    getNewSmartContract(require(path.join(__dirname, bondageStorageAbi))),
                    getNewSmartContract(require(path.join(__dirname, zapRegistryStorageAbi))),
                    getNewSmartContract(require(path.join(__dirname, arbiterStorageAbi))),
                    getNewSmartContract(tokenAbi)
                ]);
                
                
                deployedZapRegistry = await getNewRegistryContract({
                    abiFile: registryAbi,
                    regStoreAddress: registryStorage.address
                });

                currentCostStorage = await getNewCurrentCostContract({
                    abiFile: require(path.join(__dirname, currentCostAbi)),
                    pointerAddress: spacePointer.address,
                    registryAddress: deployedZapRegistry.address
                });
               
                deployedZapBondage = await getNewBondageContract({ 
                    abiFile: bondageAbi,
                    pointerAddress: spacePointer.address,
                    bondStoreAddress: bondageStorage.address,
                    tokenAddress: deployedZapToken.address,
                    currentCostAddress: currentCostStorage.address
                });
                
                deployedZapArbiter = await getNewArbiterContract({
                    abiFile: arbiterAbi,
                    pointerAddress: spacePointer.address,
                    arbiterStoreAddress: arbiterStorage.address,
                    bondageAddress: deployedZapBondage.address
                });

                addressZapArbiter = deployedZapArbiter.address;

                await Promise.all([
                    bondageStorage.transferOwnership(deployedZapBondage.address, { from: accounts[0], gas: 6000000 }),
                    registryStorage.transferOwnership(deployedZapRegistry.address, { from: accounts[0], gas: 6000000 }),
                    arbiterStorage.transferOwnership(deployedZapArbiter.address, { from: accounts[0], gas: 6000000 }),
                ]);

                const data = await Promise.all([
                    bondageStorage.owner({ from: accounts[0], gas: 6000000 }),
                    registryStorage.owner({ from: accounts[0], gas: 6000000 }),
                    arbiterStorage.owner({ from: accounts[0], gas: 6000000 })
                ]);

                assert.equal(data[0]['0'], deployedZapBondage.address);
                assert.equal(data[1]['0'], deployedZapRegistry.address);
                assert.equal(data[2]['0'], deployedZapArbiter.address);
            } catch (err) {
                throw err;
            }
        });

        it('Should initiate zapArbiter wrapper', async function() {
            const wrapper = new ZapWrapper(eth);
            zapArbiterWrapper = wrapper.initClass({
                instanceClass,
                address: addressZapArbiter,
                abiPath: arbiterAbi.abi
            });
        });

        it('Should initiate subscription', async function() {
            try {
                await deployedZapRegistry.initiateProvider(
                    providerPublicKey,
                    providerTitle,
                    oracleEndpoint,
                    params,
                    { from: accounts[2], gas: gasTransaction });

                await deployedZapRegistry.initiateProviderCurve(
                    oracleEndpoint,
                    curveType[ZapCurveType],
                    curveStart,
                    curveMultiplier,
                    { from: accounts[2], gas: gasTransaction });

                await deployedZapToken.allocate(
                    accounts[0],
                    tokensForOwner,
                    { from: accounts[0], gas: gasTransaction });

                await deployedZapToken.allocate(
                    accounts[2],
                    tokensForOracle,
                    { from: accounts[0], gas: gasTransaction });

                await deployedZapToken.allocate(
                    deployedZapBondage.address,
                    tokensForOracle,
                    { from: accounts[0], gas: gasTransaction });

                await deployedZapToken.approve(
                    deployedZapBondage.address,
                    tokensForOracle,
                    { from: accounts[0], gas: gasTransaction });

                await deployedZapBondage.bond(
                    accounts[2],
                    oracleEndpoint,
                    8,
                    { from: accounts[0], gas: gasTransaction });  

                await zapArbiterWrapper.initiateSubscription({
                    oracleAddress: accounts[2],
                    endpoint: oracleEndpoint,
                    js_params: params,
                    publicKey: providerPublicKey,
                    dots: 4,
                    from: accounts[0],
                    gas: gasTransaction
                });
            } catch (err) {
                throw err;
            }
        });

        // it('Should initiate listen in zapArbiter', async () => {
        //     const data = await zapArbiterWrapper.listen();
        //     console.log(data);
        // });
    });
});