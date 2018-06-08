const Registry = require('../../src/api/contracts/Registry');
const Web3 = require('web3');
const expect = require('chai')
                .use(require('chai-as-promised'))
                .use(require('chai-bignumber'))
                .expect;
const fs = require('fs');
const { migrateContracts, ganacheProvider, ganacheServer } = require('../bootstrap');
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
const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://127.0.0.1:7545'));


async function configureEnvironment(func) {
    await func();
}

describe('Registry', function () {
    let accounts = [];
    let addressZapRegistry;
    let abiJSON;
    let zapRegistryWrapper;
    let addressZapRegistryStorage;
    let deployedStorage;
    let abiJSONStorage;

    before(function (done) {
        configureEnvironment(async () => {
            await migrateContracts();
            accounts = await web3.eth.getAccounts();
            abiJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + contractsBuildDirectory + '/Registry.json')));
            abiJSONStorage = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + contractsBuildDirectory + '/RegistryStorage.json')));
            addressZapRegistry = abiJSON.networks[currentNetwork.id].address;
            addressZapRegistryStorage = abiJSONStorage.networks[currentNetwork.id].address;
            deployedStorage = new web3.eth.Contract(abiJSONStorage.abi, addressZapRegistryStorage);
            zapRegistryWrapper = new Registry({
                provider: web3.currentProvider,
                address: addressZapRegistry,
                artifact: abiJSON
            });
            console.log('before function is done');
            done();
        });
    });

    it('should check bind registry storage', async () => {
        const data = await deployedStorage.methods.owner().call();
        await expect(data.toLowerCase()).to.be.equal(addressZapRegistry.toLowerCase());
    });

    it('Should initiate provider in zap registry contract', async () => {
        await zapRegistryWrapper.initiateProvider({
            public_key: providerPublicKey,
            title: providerTitle,
            endpoint: specifier,
            endpoint_params: params,
            from: accounts[0],
            gas: 600000
        });
        let registryInstance = await zapRegistryWrapper.contractInstance();
        const title = web3.utils.hexToUtf8(await registryInstance.getProviderTitle(accounts[0]));

        expect(title).to.be.equal(providerTitle);
    });

    it('Should initiate Provider curve in zap registry contract', async () => {
        await zapRegistryWrapper.initiateProviderCurve({
            endpoint: specifier,
            curve: curve,
            from: accounts[0],
            gas: 3000000
        });
        let registryInstance = await zapRegistryWrapper.contractInstance();
        const c = await registryInstance.getProviderCurve(accounts[0], specifier);

        let resultConstants = c[0].map((val) => { return val.toNumber() });
        let resultParts = c[1].map((val) => { return val.toNumber() });
        let resultDividers = c[2].map((val) => { return val.toNumber() });

        await expect(resultConstants).to.deep.equal(curve.constants);
        await expect(resultParts).to.deep.equal(curve.parts);
        await expect(resultDividers).to.deep.equal(curve.dividers);
    });

    it('Should set endpoint params in zap registry contract', async () => {
        await zapRegistryWrapper.setEndpointParams({
            endpoint: specifier,
            params: params,
            from: accounts[0],
            gas: 300000
        });
        const endpointsSize = await deployedStorage.methods
            .getEndpointIndexSize(accounts[0], web3.utils.utf8ToHex(specifier))
            .call({ from: accounts[0] });

        expect(endpointsSize).to.be.equal(params.length.toString());
    });

    it('Should get oracle in zap registry contract', async () => {
        const oracle = await zapRegistryWrapper.getOracle({
            address: accounts[0],
            endpoint: specifier.valueOf()
        });

        expect(oracle.public_key.toNumber()).to.be.equal(providerPublicKey);
        expect(oracle.endpoint_params.length).to.be.equal(params.length);
    });

    after(function () {
        ganacheServer.close();
        console.log('Server stopped!');
    })
});
