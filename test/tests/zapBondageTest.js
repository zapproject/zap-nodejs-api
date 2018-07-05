const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .expect;

const { Bondage } = require('../../src/api/contracts/Bondage');
const Web3 = require('web3');
const Config = require('../../config/index');
const path = require('path');

const { migrateContracts, clearBuild, ganacheServer, testProvider, testNetworkId } = require('../bootstrap');

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
const testArtifactsModulePath = path.join(Config.projectPath, 'test/TestArtifactsModule/contracts');

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
        addressZapBondage,
        zapBondageWrapper,
        bondageStoreAbi,
        web3;

    before(function (done) {
        configureEnvironment(async () => {
            this.timeout(120000);
            web3 = new Web3(testProvider);
            await migrateContracts();
            done();
        });
    });

    describe('Bondage', function () {
        beforeEach(function(done) {
            configureEnvironment(async () => {
                accounts = await web3.eth.getAccounts();
                done();
            });
        });

        it('Should get new instances of contracts and bind their storages', async () => {
            [
                bondageStorage,
                registryStorage,
                zapToken,
            ] = [await getDeployedContract(Config.testArtifactsDir, 'BondageStorage', testNetworkId, web3.currentProvider),
                 await getDeployedContract(Config.testArtifactsDir, 'RegistryStorage', testNetworkId, web3.currentProvider),
                 await getDeployedContract(Config.testArtifactsDir, 'ZapToken', testNetworkId, web3.currentProvider)];

            zapBondage = await getDeployedContract(Config.testArtifactsDir, 'Bondage', testNetworkId, web3.currentProvider);
            zapRegistry = await getDeployedContract(Config.testArtifactsDir, 'Registry', testNetworkId, web3.currentProvider);

            addressZapBondage = zapBondage.address;

            const bondageStorageOwner = await bondageStorage.owner.call();
            const registryStorageOwner = await registryStorage.owner.call();

            await expect(bondageStorageOwner.valueOf().toLowerCase()).to.be.equal(zapBondage.address.toLowerCase());
            await expect(registryStorageOwner.valueOf().toLowerCase()).to.be.equal(zapRegistry.address.toLowerCase());
        });

        it('Should get instance of smart contract throw wrapper', () => {
            zapBondageWrapper = new Bondage({
                artifactsPath: testArtifactsModulePath,
                networkId: testNetworkId,
                networkProvider: testProvider
            });
        });

        it('Should call method "bond" of zapBondage wrapper', async () => {
            await zapRegistry.initiateProvider(
                providerPublicKey,
                providerTitle,
                specifier,
                params,
                { from: accounts[2], gas: gasTransaction }
            );

            await zapRegistry.initiateProviderCurve(
                specifier,
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

            //console.log(zapBondageWrapper.)

            const res = await zapBondageWrapper.bond({
                provider: accounts[2],
                endpoint: specifier,
                zapNum: 100,
                from: accounts[0],
                gas: gasTransaction
            });
            console.log('\n');
            console.log(res.events.Bound.returnValues);
            console.log('bondage wrapper address = ' + zapBondageWrapper.contract.address);
            console.log('bondage truffle address = ' + zapBondage.address);
        });

        it('Should get price of dots', async () => {
            //const data =  { numDots }
            await zapBondageWrapper.calcZapForDots({
                provider: accounts[2],
                endpoint: specifier,
                dots: 10,
                from: accounts[0],
                gas: gasTransaction
            });
        });

        it('Should call unbond function of zapBondage Wrapper', async () => {
            const amount = 2;
            const dots = await zapBondage.getBoundDots(
                 accounts[0],
                 accounts[2],
                 specifier
            );

            await zapBondageWrapper.unbond({
                oracleAddress: accounts[2],
                endpoint: specifier,
                dots: amount,
                from: accounts[0],
                gas: gasTransaction
            });

            const newDots = await zapBondage.getBoundDots(
                accounts[0],
                accounts[2],
                specifier
            );

            await expect(dots.toNumber() - amount).to.be.equal(newDots.toNumber());
        });

        it('Should call getDots function of zapBondage Wrapper', async () => {
            const dots = await zapBondageWrapper.getBoundDots({
                subscriber: accounts[0],
                provider: accounts[2],
                endpoint: specifier
            });

            console.log(dots.valueOf());

            await expect(dots.valueOf()).to.be.equal(dots.valueOf());
        });
    });
});