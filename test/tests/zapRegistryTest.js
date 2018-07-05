const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .expect;

const { ZapRegistry } = require('../../src/api/contracts/Registry');
const Web3 = require('web3');
const path = require('path');
const { getDeployedContract } = require("../utils");
const { migrateContracts, clearBuild, ganacheServer, testNetworkId, testProvider } = require('../bootstrap');
const Config = require('../../config/index');

const {
    providerTitle,
    providerPublicKey,
    specifier,
    params,
    curve
} = require('../utils');
const testArtifactsModulePath = path.join(Config.projectPath, 'test/TestArtifactsModule/contracts');


async function configureEnvironment(func) {
    await func();
}

describe('Registry, path to "/src/api/contracts/Registry"', () => {
    let accounts = [];
    let addressRegistry;
    let registryWrapper;
    let deployedRegistry;
    let deployedStorage;
    let web3;

    before(function (done) {
        configureEnvironment(async () => {
            this.timeout(120000);
            await migrateContracts();
            web3 = new Web3(testProvider);
            accounts = await web3.eth.getAccounts();

            deployedStorage = await getDeployedContract(Config.testArtifactsDir, 'RegistryStorage', testNetworkId, web3.currentProvider);
            deployedRegistry = await getDeployedContract(Config.testArtifactsDir, 'Registry', testNetworkId, web3.currentProvider);
            addressRegistry = deployedRegistry.address;

            registryWrapper = new ZapRegistry({
                artifactsPath: testArtifactsModulePath,
                networkId: testNetworkId,
                networkProvider: testProvider
            });

            done();
        });
    });

    describe('Registry', function () {

        it('Should check bind registry storage', async () => {
            const data = await deployedStorage.owner.call();
            await expect(data.toLowerCase()).to.be.equal(addressRegistry.toLowerCase());
        });

        it('Should initiate provider in zap registry contract', async () => {
            await registryWrapper.initiateProvider({
                public_key: providerPublicKey,
                title: providerTitle,
                endpoint: specifier,
                endpoint_params: params,
                from: accounts[0],
                gas: 600000
            });
            const title = web3.utils.hexToUtf8(await deployedRegistry.getProviderTitle(accounts[0]));

            await expect(title).to.be.equal(providerTitle);
        });

        it('Should initiate Provider curve in zap registry contract', async () => {
            await registryWrapper.initiateProviderCurve({
                endpoint: specifier,
                curve: curve,
                from: accounts[0],
                gas: 3000000
            });
            const c = await deployedRegistry.getProviderCurve(accounts[0], specifier);

            let resultConstants = c[0].map((val) => { return val.toNumber() });
            let resultParts = c[1].map((val) => { return val.toNumber() });
            let resultDividers = c[2].map((val) => { return val.toNumber() });

            await expect(resultConstants).to.deep.equal(curve.constants);
            await expect(resultParts).to.deep.equal(curve.parts);
            await expect(resultDividers).to.deep.equal(curve.dividers);
        });

        it('Should set endpoint params in zap registry contract', async () => {
            await registryWrapper.setEndpointParams({
                endpoint: specifier,
                params: params,
                from: accounts[0],
                gas: 300000
            });
            const endpointsSize = await deployedStorage.getEndpointIndexSize.call(accounts[0], specifier, { from: accounts[0] });

            await expect(endpointsSize.valueOf()).to.be.equal(params.length.toString());
        });

        after(function () {
            ganacheServer.close();
            // clearBuild(false);
            console.log('Server stopped!');
        })
    });
});

