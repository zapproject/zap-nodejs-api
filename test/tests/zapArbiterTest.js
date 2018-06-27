const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .expect;

const Web3 = require('web3');
const { migrateContracts, ganacheServer, clearBuild } = require('../bootstrap');
const {
    getDeployedContract,
    curve,
    providerTitle,
    providerPublicKey,
    params,
    oracleEndpoint,
    tokensForOracle,
    tokensForOwner,
    gasTransaction
} = require('../utils');



async function configureEnvironment(func) {
    await func();
}


describe('Arbiter, path to "/src/api/contracts/ZapArbiter"', () => {
    let addressZapArbiter;
    let accounts = [];
    let deployedZapArbiter;
    let deployedZapToken;
    let deployedZapRegistry;
    let deployedZapBondage;
    let zapArbiterWrapper;
    let arbiterStorage;
    let bondageStorage;
    let registryStorage;
    let currentCostStorage;
    let Config;
    let currentNetwork;
    let web3;
    let Arbiter;

    before(function (done) {
        configureEnvironment(async () => {
            this.timeout(60000);
            await migrateContracts();
            done();
        });
    });

    describe.only('Arbiter', function () {

        beforeEach(function(done){
            configureEnvironment(async ()=>{
                delete require.cache[require.resolve('../../config/index')];
                Config = require('../../config/index');
                currentNetwork = Config.networks['ganache'];
                web3 = new Web3(currentNetwork.provider);
                accounts = await web3.eth.getAccounts();
                delete require.cache[require.resolve('../../src/api/contracts/Arbiter')];
                Arbiter = require('../../src/api/contracts/Arbiter');
                done();
            })

        });
        it('Should get instances of smart contracts, their storages and bind owners', function () {
            try {

                [
                    bondageStorage,
                    registryStorage,
                    arbiterStorage,
                    deployedZapToken
                ] = [
                    getDeployedContract(Config.bondageStorageArtifact, currentNetwork, web3.currentProvider),
                    getDeployedContract(Config.registryStorageArtifact, currentNetwork, web3.currentProvider),
                    getDeployedContract(Config.arbiterStorageArtifact, currentNetwork, web3.currentProvider),
                    getDeployedContract(Config.zapTokenArtifact, currentNetwork, web3.currentProvider)
                ];

                deployedZapRegistry = getDeployedContract(Config.registryArtifact, currentNetwork, web3.currentProvider);
                currentCostStorage = getDeployedContract(Config.currentCostArtifact, currentNetwork, web3.currentProvider);
                deployedZapBondage = getDeployedContract(Config.bondageArtifact, currentNetwork, web3.currentProvider);
                deployedZapArbiter = getDeployedContract(Config.arbiterArtifact, currentNetwork, web3.currentProvider);

                addressZapArbiter = deployedZapArbiter.address;
                Arbiter = require('../../src/api/contracts/Arbiter');

            } catch (err) {
                throw err;
            }
        });

        it('Should initiate zapArbiter wrapper', function () {
            zapArbiterWrapper = new Arbiter();
        });

        it('Should initiate subscription', async function () {
            accounts = await web3.eth.getAccounts()
            await deployedZapRegistry.initiateProvider(
                providerPublicKey,
                providerTitle,
                oracleEndpoint,
                params,
                { from: accounts[2], gas: gasTransaction });

            await deployedZapRegistry.initiateProviderCurve(
                oracleEndpoint,
                curve.constants,
                curve.parts,
                curve.dividers,
                { from: accounts[2], gas: 1000000 });

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
                100,
                { from: accounts[0], gas: gasTransaction });

            await zapArbiterWrapper.initiateSubscription({
                oracleAddress: accounts[2],
                endpoint: oracleEndpoint,
                endpointParams: params,
                blocks: 4,
                publicKey: providerPublicKey,
                from: accounts[0],
                gas: gasTransaction
            });
        });
        it('Should listen to Data purchase in zapArbiter', async function () {
           // zapArbiterWrapper = new Arbiter();
            zapArbiterWrapper.listen((err,res)=>{
                //console.log("event listen : ", err,res)
                //expect(err).to.be.null;
                //expect(res.event).to.be.equal("DataPurchase")
                return
            });
        });
    });
});