const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .expect;

const Dispatch = require('../../src/api/contracts/Dispatch');
const Web3 = require('web3');
const { migrateContracts, ganacheServer, clearBuild } = require('../bootstrap');
const {
    getDeployedContract,
    providerPublicKey,
    providerTitle,
    oracleEndpoint,
    params,
    gasTransaction,
    curve,
    tokensForOracle,
    tokensForOwner,
    query
} = require('../utils');
const Config = require('../../config/index');

const currentNetwork = Config.ganacheNetwork;
const web3 = new Web3(currentNetwork.provider);

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
        currentCostStorage,
        deployedZapBondage,
        deployedZapDispatch,
        deployedZapArbiter,
        addressZapDispatch,
        zapDispatchWrapper,
        dispatchAbi,
        tokenAbi,
        arbiterAbi,
        registryAbi,
        bondageAbi,
        dispatchStorageAbi,
        arbiterStorageAbi,
        registryStorageAbi,
        bondageStorageAbi,
        currentCostAbi,
        queryData;

    before(function (done) {
        configureEnvironment(async () => {
            this.timeout(60000);
            await migrateContracts();

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
                oracleEndpoint,
                params,
                { from: oracleAddress, gas: gasTransaction } // from provider
            );
            await deployedZapRegistry.initiateProviderCurve(
                oracleEndpoint,
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
                oracleEndpoint,
                100,
                { from: subscriber, gas: 1000000 }
            );
            const contract = await getDeployedContract(dispatchAbi, currentNetwork, web3.currentProvider);

            const queryResult = await contract.query(
                oracleAddress,
                query,
                oracleEndpoint,
                params,
                false,
                { from: subscriber, gas: gasTransaction }
            );

            return queryResult;
        }

        async function getNewSmartContracts() {
            dispatchAbi = Config.getDispatchArtifact();
            tokenAbi = Config.getZapTokenArtifact();
            arbiterAbi = Config.getArbiterArtifact();
            registryAbi = Config.getRegistryArtifact();
            bondageAbi = Config.getBondageArtifact();
            dispatchStorageAbi = Config.getDispatchStorageArtifact();
            arbiterStorageAbi = Config.getArbiterStorageArtifact();
            registryStorageAbi = Config.getRegistryStorageArtifact();
            bondageStorageAbi = Config.getBondageStorageArtifact();
            currentCostAbi = Config.getCurrentCostArtifact();
            [
                bondageStorage,
                registryStorage,
                arbiterStorage,
                deployedZapToken,
                dispatchStorage
            ] = await Promise.all([
                getDeployedContract(bondageStorageAbi, currentNetwork, web3.currentProvider),
                getDeployedContract(registryStorageAbi, currentNetwork, web3.currentProvider),
                getDeployedContract(arbiterStorageAbi, currentNetwork, web3.currentProvider),
                getDeployedContract(tokenAbi, currentNetwork, web3.currentProvider),
                getDeployedContract(dispatchStorageAbi, currentNetwork, web3.currentProvider)
            ]);
            deployedZapRegistry = await getDeployedContract(registryAbi, currentNetwork, web3.currentProvider);
            currentCostStorage = await getDeployedContract(currentCostAbi, currentNetwork, web3.currentProvider);
            deployedZapBondage = await getDeployedContract(bondageAbi, currentNetwork, web3.currentProvider);
            deployedZapDispatch = await getDeployedContract(dispatchAbi, currentNetwork, web3.currentProvider);
            deployedZapArbiter = await getDeployedContract(arbiterAbi, currentNetwork, web3.currentProvider);

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
            zapDispatchWrapper = new Dispatch({
                provider: web3.currentProvider,
                address: addressZapDispatch,
                artifact: dispatchAbi
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