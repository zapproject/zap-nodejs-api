const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .expect;

const Bondage = require('../../src/api/contracts/Bondage');
const Web3 = require('web3');

const { migrateContracts, clearBuild, ganacheServer } = require('../bootstrap');

const {
    zapBondageAbi,
    bondageStorageAbi,
    zapTokenAbi,
    zapRegistryAbi,
    zapRegistryStorageAbi,
    currentCostAbi,
    addressSpacePointerAbi,
    ganacheNetwork
} = require('../../config');
const { join } = require('path');
const fs = require('fs');
const {
    getDeployedContract,
    curve,
    providerTitle,
    providerPublicKey,
    params,
    specifier,
    oracleEndpoint,
    tokensForOracle,
    tokensForOwner,
    gasTransaction
} = require('../utils');

const currentNetwork = ganacheNetwork;
const web3 = new Web3(new Web3.providers.WebsocketProvider(currentNetwork.address));

async function configureEnvironment(func) {
    await func();
}


describe('Bondage, path to "/src/api/contracts/Bondage"', () => {

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
        zapBondageWrapper,
        bondageStoreAbi;

    before(function (done) {
        configureEnvironment(async () => {
            this.timeout(60000);
            await migrateContracts();
            accounts = await web3.eth.getAccounts();
            done();
        });
    });

    describe('Bondage', function () {

        it('Should get new instances of contracts and bind their storages', async () => {
            bondageAbi = JSON.parse(fs.readFileSync(join(__dirname, '../' + zapBondageAbi)));
            bondageStoreAbi = JSON.parse(fs.readFileSync(join(__dirname, '../' + bondageStorageAbi)));

            const registryAbi = JSON.parse(fs.readFileSync(join(__dirname, '../' + zapRegistryAbi)));
            const registryStoreAbi = JSON.parse(fs.readFileSync(join(__dirname, '../' + zapRegistryStorageAbi)));
            const tokenAbi = JSON.parse(fs.readFileSync(join(__dirname, '../' + zapTokenAbi)));
            const costStorageAbi = JSON.parse(fs.readFileSync(join(__dirname, '../' + currentCostAbi)));

            [
                bondageStorage,
                registryStorage,
                zapToken,
            ] = await Promise.all([
                getDeployedContract(bondageStoreAbi, currentNetwork, web3.currentProvider),
                getDeployedContract(registryStoreAbi, currentNetwork, web3.currentProvider),
                getDeployedContract(tokenAbi, currentNetwork, web3.currentProvider),
            ]);

            zapRegistry = await getDeployedContract(registryAbi, currentNetwork, web3.currentProvider);
            currentCostStorage = await getDeployedContract(costStorageAbi, currentNetwork, web3.currentProvider);
            zapBondage = await getDeployedContract(bondageAbi, currentNetwork, web3.currentProvider);

            addressZapBondage = zapBondage.address;

            const bondageStorageOwner = await bondageStorage.owner.call();
            const registryStorageOwner = await registryStorage.owner.call();

            await expect(bondageStorageOwner.valueOf().toLowerCase()).to.be.equal(zapBondage.address.toLowerCase());
            await expect(registryStorageOwner.valueOf().toLowerCase()).to.be.equal(zapRegistry.address.toLowerCase());
        });

        it('Should get instance of smart contract throw wrapper', () => {
            zapBondageWrapper = new Bondage({
                provider: web3.currentProvider,
                address: addressZapBondage,
                artifact: bondageAbi
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
                curve.constants,
                curve.parts,
                curve.dividers,
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
                endpoint: specifier,
                amountOfZap: 100,
                from: accounts[0],
                gas: gasTransaction
            });
        });

        it('Should get price of dots', async () => {
            //const data =  { numDots }
            await zapBondageWrapper.estimateBond({
                oracleAddress: accounts[2],
                endpoint: specifier.valueOf(),
                amountOfZap: 10,
                from: accounts[0],
                gas: gasTransaction
            });
        });

        it('Should call unbond function of zapBondage Wrapper', async () => {
            const amount = 2;
            const dots = await zapBondage.getBoundDots(
                accounts[0],
                accounts[2],
                oracleEndpoint
            );

            await zapBondageWrapper.unbond({
                oracleAddress: accounts[2],
                endpoint: specifier.valueOf(),
                amountOfDots: amount,
                from: accounts[0],
                gas: gasTransaction
            });

            const newDots = await zapBondage.getBoundDots(
                accounts[0],
                accounts[2],
                oracleEndpoint
            );

            await expect(dots.toNumber() - amount).to.be.equal(newDots.toNumber());
        });

        it('Should call getDots function of zapBondage Wrapper', async () => {
            const dots = await zapBondageWrapper.getBoundDots({
                holderAddress: accounts[0],
                oracleAddress: accounts[2],
                specifier: specifier
            });

            await expect(dots.toNumber()).to.be.equal(dots.toNumber());
        });
    });
});