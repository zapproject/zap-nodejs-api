const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .expect;

const Arbiter = require('../../src/api/contracts/Arbiter');
const Web3 = require('web3');
const { migrateContracts, ganacheServer, clearBuild } = require('../bootstrap');
const {
    zapArbiterAbi,
    zapTokenAbi,
    zapRegistryAbi,
    zapBondageAbi,
    arbiterStorageAbi,
    zapRegistryStorageAbi,
    bondageStorageAbi,
    currentCostAbi,
    addressSpacePointerAbi,
    ganacheNetwork
} = require('../../config');
const path = require('path');
const fs = require('fs');
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

const currentNetwork = ganacheNetwork;
const web3 = new Web3(new Web3.providers.WebsocketProvider(currentNetwork.address));

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
    let zapArbiter;
    let arbiterAbi;
    let zapArbiterWrapper;
    let arbiterStorage;
    let bondageStorage;
    let registryStorage;
    let currentCostStorage;

    before(function (done) {
        configureEnvironment(async () => {
            this.timeout(60000);
            await migrateContracts();
            accounts = await web3.eth.getAccounts();
            done();
        });
    });

    describe('Arbiter', function () {

        it('Should get instances of smart contracts, their storages and bind owners', async function () {
            try {
                arbiterAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + zapArbiterAbi)));
                let tokenAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + zapTokenAbi)));
                let registryAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + zapRegistryAbi)));
                let bondageAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + zapBondageAbi)));

                let bondageStorAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + bondageStorageAbi)));
                let registryStorAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + zapRegistryStorageAbi)));
                let arbiterStorAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + arbiterStorageAbi)));
                let currCostAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + currentCostAbi)));

                [
                    bondageStorage,
                    registryStorage,
                    arbiterStorage,
                    deployedZapToken
                ] = await Promise.all([
                    getDeployedContract(bondageStorAbi, currentNetwork, web3.currentProvider),
                    getDeployedContract(registryStorAbi, currentNetwork, web3.currentProvider),
                    getDeployedContract(arbiterStorAbi, currentNetwork, web3.currentProvider),
                    getDeployedContract(tokenAbi, currentNetwork, web3.currentProvider)
                ]);

                deployedZapRegistry = await getDeployedContract(registryAbi, currentNetwork, web3.currentProvider);
                currentCostStorage = await getDeployedContract(currCostAbi, currentNetwork, web3.currentProvider);
                deployedZapBondage = await getDeployedContract(bondageAbi, currentNetwork, web3.currentProvider);
                deployedZapArbiter = await getDeployedContract(arbiterAbi, currentNetwork, web3.currentProvider);

                addressZapArbiter = deployedZapArbiter.address;

                const data = await Promise.all([
                    bondageStorage.owner.call({ from: accounts[0], gas: 6000000 }),
                    registryStorage.owner.call({ from: accounts[0], gas: 6000000 }),
                    arbiterStorage.owner.call({ from: accounts[0], gas: 6000000 })
                ]);

                await expect(data[0].toString().toLowerCase()).to.be.equal(deployedZapBondage.address.toLowerCase());
                await expect(data[1].toString().toLowerCase()).to.be.equal(deployedZapRegistry.address.toLowerCase());
                await expect(data[2].toString().toLowerCase()).to.be.equal(deployedZapArbiter.address.toLowerCase());
            } catch (err) {
                throw err;
            }
        });

        it('Should initiate zapArbiter wrapper', async function () {
            zapArbiterWrapper = new Arbiter({
                provider: web3.currentProvider,
                address: addressZapArbiter,
                artifact: arbiterAbi
            });
        });

        it('Should initiate subscription', async function () {
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
                js_params: params,
                dots: 4,
                publicKey: providerPublicKey,
                from: accounts[0],
                gas: gasTransaction
            });
        });

        // that test doesn\'t worl correct
        // need to add moch for listen event from smart contract
        // it('Should initiate listen in zapArbiter', async function (done) {
        //     try {
        //         zapArbiterWrapper.listen()
        //             .then(data => {
        //                 console.log(data);
        //                 done();
        //             })
        //             .catch(err => {
        //                 zapArbiterWrapper.close();
        //                 console.log('errrr', err);
        //                 throw err;
        //             });
                
        //         await new Promise((resolve) => {
        //             setTimeout(() => resolve('done'), 500);
        //         });
                
        //         await zapArbiterWrapper.initiateSubscription({
        //             oracleAddress: accounts[3],
        //             endpoint: oracleEndpoint,
        //             js_params: params,
        //             publicKey: providerPublicKey,
        //             dots: 4,
        //             from: accounts[0],
        //             gas: gasTransaction
        //         });
        //     } catch (err) {
        //         console.log(err);
        //         throw err;
        //     }
        // });
    });
});