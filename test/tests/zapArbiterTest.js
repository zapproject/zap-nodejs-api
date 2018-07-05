const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .expect;

const Web3 = require('web3');
const Config = require('../../config/index');
const path = require('path');
const {migrateContracts, testProvider, testNetworkId, ganacheServer, clearBuild} = require('../bootstrap');
const {
    getDeployedContract,
    curve,

    providerTitle,
    providerPublicKey,
    params,
    oracleEndpoint,
    tokensForOracle,
    tokensForOwner,
    gasTransaction,
} = require('../utils');
const testArtifactsModulePath = path.join(Config.projectPath, 'test/TestArtifactsModule/contracts');

async function configureEnvironment(func) {
    await func();
}

describe('Arbiter, path to "/src/api/contracts/ZapArbiter"', () => {
    let accounts = [];
    let deployedZapArbiter;
    let deployedZapToken;
    let deployedZapRegistry;
    let deployedZapBondage;
    let zapArbiterWrapper;
    let web3;
    let Arbiter;

    before(function (done) {
        configureEnvironment(async () => {
            this.timeout(120000);
            web3 = new Web3(testProvider);
            await migrateContracts();
            done();
        });
    });

    describe('Arbiter', function () {

        beforeEach(function (done) {
            configureEnvironment(async () => {
                accounts = await web3.eth.getAccounts();
                Arbiter = require('../../src/api/contracts/Arbiter').Arbiter;
                done();
            });

        });

        it('Should get instances of smart contracts, their storages and bind owners', async function () {
            try {
                deployedZapToken = getDeployedContract(Config.testArtifactsDir, 'ZapToken', testNetworkId, testProvider);
                deployedZapRegistry = getDeployedContract(Config.testArtifactsDir, 'Registry', testNetworkId, testProvider);
                deployedZapBondage = getDeployedContract(Config.testArtifactsDir, 'Bondage', testNetworkId, testProvider);
                deployedZapArbiter = getDeployedContract(Config.testArtifactsDir, 'Arbiter', testNetworkId, testProvider);
            } catch (err) {
                throw err;
            }
        });

        it('Should initiate zapArbiter wrapper', async function () {
            zapArbiterWrapper = new Arbiter({
                artifactsPath: testArtifactsModulePath,
                networkId: testNetworkId,
                networkProvider: testProvider
            });
        });

        it('Should initiate subscription', async function () {
            await deployedZapRegistry.initiateProvider(
                providerPublicKey,
                providerTitle,
                oracleEndpoint,
                params,
                {from: accounts[2], gas: gasTransaction});

            await deployedZapRegistry.initiateProviderCurve(
                oracleEndpoint,
                curve.constants,
                curve.parts,
                curve.dividers,
                {from: accounts[2], gas: 1000000});

            await deployedZapToken.allocate(
                accounts[0],
                tokensForOwner,
                {from: accounts[0], gas: gasTransaction});

            await deployedZapToken.allocate(
                accounts[2],
                tokensForOracle,
                {from: accounts[0], gas: gasTransaction});

            await deployedZapToken.allocate(
                deployedZapBondage.address,
                tokensForOracle,
                {from: accounts[0], gas: gasTransaction});

            await deployedZapToken.approve(
                deployedZapBondage.address,
                tokensForOracle,
                {from: accounts[0], gas: gasTransaction});

            await deployedZapBondage.bond(
                accounts[2],
                oracleEndpoint,
                100,
                {from: accounts[0], gas: gasTransaction});

            await zapArbiterWrapper.initiateSubscription({
                oracleAddress: accounts[2],
                endpoint: oracleEndpoint,
                endpointParams: params,
                blocks: 4,
                publicKey: providerPublicKey,
                from: accounts[0],
                gas: gasTransaction,
            });
        });
        it('Should listen to Data purchase in zapArbiter', async function () {
            // zapArbiterWrapper = new Arbiter();
            zapArbiterWrapper.listen((err, res) => {
                // console.log("event listen : ", err,res)
                // expect(err).to.be.null;
                // expect(res.event).to.be.equal("DataPurchase")
                return;
            });
        });
    });
});
