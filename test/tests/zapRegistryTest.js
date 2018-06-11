const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .expect;

const Registry = require('../../src/api/contracts/Registry');
const Web3 = require('web3');
const { getDeployedContract } = require("../utils");
const fs = require('fs');
const { migrateContracts, clearBuild, ganacheServer } = require('../bootstrap');
const { ganacheNetwork, contractsBuildDirectory } = require('../../config');
const path = require('path');

const {
    providerTitle,
    providerPublicKey,
    specifier,
    params,
    curve
} = require('../utils');

const currentNetwork = ganacheNetwork;
const web3 = new Web3(new Web3.providers.WebsocketProvider(currentNetwork.address));


async function configureEnvironment(func) {
    await func();
}

describe('Registry, path to "/src/api/contracts/Registry"', () => {
    let accounts = [];
    let addressRegistry;
    let abiJSON;
    let registryWrapper;
    let addressRegistryStorage;
    let deployedStorage;
    let abiJSONStorage;

    before(function (done) {
        configureEnvironment(async () => {
            this.timeout(60000);
            await migrateContracts();

            accounts = await web3.eth.getAccounts();
            abiJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + contractsBuildDirectory + '/Registry.json')));
            abiJSONStorage = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + contractsBuildDirectory + '/RegistryStorage.json')));
            addressRegistry = abiJSON.networks[currentNetwork.id].address;

            deployedStorage = await getDeployedContract(abiJSONStorage, currentNetwork, web3.currentProvider);

            registryWrapper = new Registry({
                provider: web3.currentProvider,
                address: addressRegistry,
                artifact: abiJSON
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
            let registryInstance = await registryWrapper.contractInstance();
            const title = web3.utils.hexToUtf8(await registryInstance.getProviderTitle(accounts[0]));

            expect(title).to.be.equal(providerTitle);
        });

        it('Should initiate Provider curve in zap registry contract', async () => {
            await registryWrapper.initiateProviderCurve({
                endpoint: specifier,
                curve: curve,
                from: accounts[0],
                gas: 3000000
            });
            let registryInstance = await registryWrapper.contractInstance();
            const c = await registryInstance.getProviderCurve(accounts[0], specifier);

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

            expect(endpointsSize.valueOf()).to.be.equal(params.length.toString());
        });

        it('Should get oracle in zap registry contract', async () => {
            const oracle = await registryWrapper.getOracle({
                address: accounts[0],
                endpoint: specifier.valueOf()
            });

            expect(oracle.public_key.toNumber()).to.be.equal(providerPublicKey);
            expect(oracle.endpoint_params.length).to.be.equal(params.length);
        });

        after(function () {
            ganacheServer.close();
            // clearBuild(false);
            console.log('Server stopped!');
        })
    });
});

