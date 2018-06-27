const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .expect;

const Config = require('../../config/index');
const Bondage = require('../../src/api/contracts/Bondage');
const Web3 = require('web3');

const { migrateContracts, clearBuild, ganacheServer } = require('../bootstrap');

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

const currentNetwork = Config.ganacheNetwork;
const web3 = new Web3(currentNetwork.provider);

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
        bondageStoreAbi,
        Config,
        currentNetwork,
        web3;

    before(function (done) {
        configureEnvironment(async () => {
            this.timeout(60000);
            await migrateContracts();
            done();
        });
    });

    describe('Bondage', function () {
        beforeEach(function(done){
            configureEnvironment(async ()=>{
                delete require.cache[require.resolve('../../config/index')];
                Config = require('../../config/index');
                currentNetwork = Config.networks['ganache'];
                web3 = new Web3(currentNetwork.provider);
                accounts = await web3.eth.getAccounts();
                delete require.cache[require.resolve('../../src/api/contracts/Arbiter')];
                Dispatch = require('../../src/api/contracts/Dispatch');
                done();
            });

        it('Should get new instances of contracts and bind their storages', async () => {
            [
                bondageStorage,
                registryStorage,
                zapToken,
            ] = [getDeployedContract(bondageStoreAbi, currentNetwork, web3.currentProvider),
                getDeployedContract(registryStoreAbi, currentNetwork, web3.currentProvider),
                getDeployedContract(tokenAbi, currentNetwork, web3.currentProvider)];

            deployedZapRegistry = getDeployedContract(Config.registryArtifact, currentNetwork, web3.currentProvider);
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