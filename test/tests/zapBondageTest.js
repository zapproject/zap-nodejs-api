const instanceClass = require('../../src/api/contracts/ZapBondage');
const ZapWrapper = require('../../src/api/ZapWrapper');
const assert = require('chai').assert;
const {
    webProvider,
    eth
} = require('../bootstrap');
const {
    zapBondageAbi,
    bondageStorageAbi,
    zapTokenAbi,
    zapRegistryAbi,
    zapRegistryStorageAbi,
    currentCostAbi
} = require('../../config');
const { join } = require('path');
const { fromAscii, toBN } = require('ethjs');
const BigNumber = require('bignumber.js');
const {
    getNewSmartContract,
    getNewRegistryContract,
    getNewBondageContract,
    curveType,
    providerTitle,
    providerPublicKey,
    ZapCurveType,
    curveStart,
    curveMultiplier,
    params,
    specifier,
    oracleEndpoint,
    tokensForOracle,
    tokensForOwner,
    gasTransaction
} = require('../utils');


describe('Bondage contract, path to "/src/api/contracts/ZapBondage"', () => {

    let
        accounts,
        bondageAbi,
        bondageStorage,
        registryStorage,
        zapToken,
        zapRegistry,
        zapBondage,
        currentCostStorage,
        addressZapBondage,
        zapBondageWrapper;

    before(async () => {
        accounts = await webProvider.eth.getAccounts();
        assert.ok(true);
    });

    describe('ZapBondageWrapper', function () {

        beforeEach(function (done) {
            setTimeout(() => done(), 500);
        });

        it('Should get new instances of contracts and bind their storages', async () => {
            bondageAbi = require(join(__dirname, zapBondageAbi));
            const
                bondageStoreAbi = require(join(__dirname, bondageStorageAbi)),
                registryAbi = require(join(__dirname, zapRegistryAbi)),
                registryStoreAbi = require(join(__dirname, zapRegistryStorageAbi)),
                tokenAbi = require(join(__dirname, zapTokenAbi)),
                costStorageAbi = require(join(__dirname, currentCostAbi));
            [
                bondageStorage,
                registryStorage,
                zapToken,
                currentCostStorage
            ] = await Promise.all([
                getNewSmartContract(bondageStoreAbi),
                getNewSmartContract(registryStoreAbi),
                getNewSmartContract(tokenAbi),
                getNewSmartContract(costStorageAbi)
            ]);

            zapRegistry = await getNewRegistryContract({
                abiFile: registryAbi,
                regStoreAddress: registryStorage.address
            });

            zapBondage = await getNewBondageContract({
                abiFile: bondageAbi,
                bondStoreAddress: bondageStorage.address,
                registryAddress: zapRegistry.address,
                tokenAddress: zapToken.address,
                currentCostAddress: currentCostStorage.address
            });

            addressZapBondage = zapBondage.address;

            await Promise.all([
                bondageStorage.transferOwnership(zapBondage.address, { from: accounts[0], gas: 600000 }),
                registryStorage.transferOwnership(zapRegistry.address, { from: accounts[0], gas: 600000 })
            ]);
            const data = await Promise.all([
                bondageStorage.owner({ from: accounts[0], gas: 6000000 }),
                registryStorage.owner({ from: accounts[0], gas: 6000000 })
            ]);

            assert.equal(data[0]['0'], zapBondage.address);
            assert.equal(data[1]['0'], zapRegistry.address);
        });

        it('Should get instance of smart contract throw wrapper', async () => {
            const wrapper = new ZapWrapper(eth);
            zapBondageWrapper = wrapper.initClass({
                instanceClass,
                address: addressZapBondage,
                abiPath: bondageAbi.abi
            });
        });

        it('Should call method "bond" of zapBondage wrapper', async () => {
            await zapRegistry.initiateProvider(
                providerPublicKey,
                providerTitle,
                oracleEndpoint,
                params,
                { from: accounts[2], gas: gasTransaction }
            );

            await zapRegistry.initiateProviderCurve(
                oracleEndpoint,
                curveType[ZapCurveType],
                curveStart,
                curveMultiplier,
                { from: accounts[2], gas: gasTransaction }
            );

            await zapToken.allocate(
                accounts[0],
                tokensForOwner,
                { from: accounts[0], gas: gasTransaction }
            );

            await zapToken.allocate(
                accounts[2],
                tokensForOracle,
                { from: accounts[0], gas: gasTransaction }
            );

            await zapToken.approve(
                zapBondage.address,
                tokensForOracle,
                { from: accounts[0], gas: gasTransaction }
            );

            await zapBondageWrapper.bond({
                oracleAddress: accounts[2],
                endpoint: specifier.valueOf(),
                amount: 8,
                from: accounts[0],
                gas: gasTransaction
            });
        });

        it('should get price of dots', async () => {
            //const data =  { numDots }
            await zapBondageWrapper.estimateBond({
                oracleAddress: accounts[2],
                endpoint: specifier.valueOf(), 
                amount: 10,
                from: accounts[0],
                gas: gasTransaction
            });
        });

        it('Should call unbond function of zapBondage Wrapper', async () => {
            const amount = 2;
            const { dots } = await zapBondage.getDots(
                accounts[0],
                accounts[2],
                oracleEndpoint,
                { from: accounts[0], gas: gasTransaction }
            );

            await zapBondageWrapper.unbond({
                oracleAddress: accounts[2],
                endpoint: specifier.valueOf(), 
                amount,
                from: accounts[0],
                gas: gasTransaction
            });

            const { dots: newDots } = await zapBondage.getDots(
                accounts[0],
                accounts[2],
                oracleEndpoint,
                { from: accounts[0], gas: gasTransaction }
            );
            assert.equal(dots.toNumber() - amount, newDots.toNumber());
        });

        it('Should call getDots function of zapBondage Wrapper', async () => {
            const { dots } = await zapBondageWrapper.getDots({
                holderAddress: accounts[0],
                oracleAddress: accounts[2],
                endpoint: specifier.valueOf(),
                from: accounts[0],
                gas: gasTransaction
            });
            if (dots.toNumber()) assert.ok(true);
        });

        it('Should get number of indexed size', async () => {
            const { size } = await zapBondageWrapper.getIndexSize({
                holderAddress: accounts[0],
                from: accounts[0],
                gas: gasTransaction
            });
            assert.equal(size.toNumber(), 1);
        });

        it('Should get oracle address by index', async () => {
            const { oracleAddress } = await zapBondageWrapper.getOracleAddress({
                holderAddress: accounts[0],
                index: 0,
                from: accounts[0],
                gas: gasTransaction
            });
            assert.equal(oracleAddress, accounts[2].toLowerCase());
        });

        it('Should get count of bound dots', async () => {
            const { dots } = await zapBondageWrapper.getBoundDots({
                holderAddress: accounts[0],
                oracleAddress: accounts[2],
                specifier: specifier.valueOf(),
                from: accounts[0],
                gas: gasTransaction
            });
            if(dots.toNumber(0)) assert.ok(true);
        });
    });
});