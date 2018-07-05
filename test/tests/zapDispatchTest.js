const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .expect;

const Web3 = require('web3');
const path = require('path');
const { migrateContracts, ganacheServer, clearBuild, testNetworkId, testProvider } = require('../bootstrap');
const {
    getDeployedContract,
    providerPublicKey,
    providerTitle,
    specifier,
    params,
    gasTransaction,
    curve,
    tokensForOracle,
    tokensForOwner,
    query
} = require('../utils');
const Config = require('../../config/index');
const { ZapDispatch } = require('../../src/api/contracts/Dispatch');
const testArtifactsModulePath = path.join(Config.projectPath, 'test/TestArtifactsModule/contracts');

async function configureEnvironment(func) {
    await func();
}

describe('Dispatch, path to "/src/api/contract/Dispatch"', () => {
    let accounts,
        subscriber,
        bondageStorage,
        registryStorage,
        arbiterStorage,
        deployedZapToken,
        dispatchStorage,
        deployedZapRegistry,
        deployedZapBondage,
        deployedZapDispatch,
        deployedZapArbiter,
        addressZapDispatch,
        zapDispatchWrapper,
        queryData,
        web3;

    before(function (done) {
        configureEnvironment(async () => {
            this.timeout(60000);
            await migrateContracts();
            web3 = new Web3(testProvider);
            accounts = await web3.eth.getAccounts();
            subscriber = accounts[8];
            done();
        });
    });

    describe('Dispatch', () => {

        async function executeQueryFlow(oracleAddress, dots = 8, dotsToRelease = 4) {
            await deployedZapRegistry.initiateProvider(
                providerPublicKey,
                providerTitle,
                specifier,
                params,
                { from: oracleAddress, gas: gasTransaction } // from provider
            );
            await deployedZapRegistry.initiateProviderCurve(
                specifier,
                curve.constants,
                curve.parts,
                curve.dividers,
                { from: oracleAddress, gas: gasTransaction } // from provider
            );
            await deployedZapToken.allocate(
                accounts[0],
                tokensForOwner,
                { from: accounts[0], gas: gasTransaction }
            );
            await deployedZapToken.allocate(
                oracleAddress,
                tokensForOracle,
                { from: accounts[0], gas: gasTransaction }
            );
            await deployedZapToken.allocate(
                subscriber,
                tokensForOracle,
                { from: accounts[0], gas: gasTransaction }
            );
            await deployedZapToken.approve(
                deployedZapBondage.address,
                tokensForOracle,
                { from: subscriber }
            );
            await deployedZapBondage.bond(
                oracleAddress,
                specifier,
                100,
                { from: subscriber, gas: 1000000 }
            );
            const contract = await getDeployedContract(Config.testArtifactsDir, 'Dispatch', testNetworkId, web3.currentProvider);

            const queryResult = await contract.query(
                oracleAddress,
                query,
                specifier,
                params,
                false,
                false,
                { from: subscriber, gas: gasTransaction }
            );

            return queryResult;
        }

        async function getNewSmartContracts() {
            [
                bondageStorage,
                registryStorage,
                arbiterStorage,
                deployedZapToken,
                dispatchStorage
            ] = await Promise.all([
                getDeployedContract(Config.testArtifactsDir, 'BondageStorage', testNetworkId, web3.currentProvider),
                getDeployedContract(Config.testArtifactsDir, 'RegistryStorage', testNetworkId, web3.currentProvider),
                getDeployedContract(Config.testArtifactsDir, 'ArbiterStorage', testNetworkId, web3.currentProvider),
                getDeployedContract(Config.testArtifactsDir, 'ZapToken', testNetworkId, web3.currentProvider),
                getDeployedContract(Config.testArtifactsDir, 'DispatchStorage', testNetworkId, web3.currentProvider)
            ]);

            deployedZapRegistry = await getDeployedContract(Config.testArtifactsDir, 'Registry', testNetworkId, web3.currentProvider);
            deployedZapBondage = await getDeployedContract(Config.testArtifactsDir, 'Bondage', testNetworkId, web3.currentProvider);
            deployedZapDispatch = await getDeployedContract(Config.testArtifactsDir, 'Dispatch', testNetworkId, web3.currentProvider);
            deployedZapArbiter = await getDeployedContract(Config.testArtifactsDir, 'Arbiter', testNetworkId, web3.currentProvider);

            addressZapDispatch = deployedZapDispatch.address;

            return Promise.all([
                bondageStorage.owner({ from: accounts[0], gas: 6000000 }),
                registryStorage.owner({ from: accounts[0], gas: 6000000 }),
                arbiterStorage.owner({ from: accounts[0], gas: 6000000 }),
                dispatchStorage.owner({ from: accounts[0], gas: 6000000 })
            ]);
        }

        it('Should get instances of smart contract and bind their storages', async () => {
            const data = await getNewSmartContracts();

            await expect(data[0].valueOf()).to.be.equal(deployedZapBondage.address);
            await expect(data[1].valueOf()).to.be.equal(deployedZapRegistry.address);
            await expect(data[2].valueOf()).to.be.equal(deployedZapArbiter.address);
            await expect(data[3].valueOf()).to.be.equal(deployedZapDispatch.address);
        });

        it('Should get instance of Zap Dispatch smart contract throw wrapper', () => {
            zapDispatchWrapper = new ZapDispatch({
                artifactsPath: testArtifactsModulePath,
                networkId: testNetworkId,
                networkProvider: testProvider
            });
        });

        it('Should call query function in Dispatch smart contract', async () => {
            queryData = await executeQueryFlow(accounts[2]);
            await expect(queryData.logs[0].event).to.be.equal('Incoming');
        });

        it('Should call respond function in Dispatch smart contract', async () => {
            try {
                zapDispatchWrapper.respond(queryData.logs[0].args.id, queryData.logs[0].args.endpoint_params, accounts[2]);
            } catch(e) {
                await expect(e.toString()).to.include('revert');
            }
        });
    });
});