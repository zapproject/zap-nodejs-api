
const instanceClass = require('../../src/api/contracts/ZapDispatch');
const ZapWrapper = require('../../src/api/ZapWrapper');
const assert = require('chai').assert;
const {
    webProvider,
    eth,
    web3
} = require('../bootstrap');
const { join } = require('path');
const {
    getInstanceOfSmartContract,
    getNewSmartContract,
    getNewRegistryContract,
    getNewCurrentCostContract,
    getNewBondageContract,
    getNewDispatchContract,
    getNewArbiterContract,
    providerPublicKey,
    providerTitle,
    oracleEndpoint,
    params,
    gasTransaction,
    curveType,
    ZapCurveType,
    curveStart,
    curveMultiplier,
    tokensForOracle,
    tokensForOwner,
    query,
    getNewTestSubscriberContract
    // specifier
} = require('../utils');
const {
    zapDispatchAbi,
    zapArbiterAbi,
    zapTokenAbi,
    zapRegistryAbi,
    zapBondageAbi,
    addressSpacePointerAbi,
    zapDispatchStorageAbi,
    arbiterStorageAbi: zapArbiterStorageAbi,
    zapRegistryStorageAbi,
    bondageStorageAbi: zapBondageStorageAbi,
    currentCostAbi: zapCurrentCostAbi,
    // queryCallerAbi
    testSubscriberAbi: zapTestSubscriberAbi
} = require('../../config');

describe('Dispatch, path to "/src/api/contract/ZapDispatch"', () => {
    let accounts,
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
        wrapper,
        testSubscriber,
        testSubscriberAbi,
        data,
        dispatchAbi,
        tokenAbi,
        arbiterAbi,
        registryAbi,
        bondageAbi,
        dispatchStorageAbi,
        arbiterStorageAbi,
        registryStorageAbi,
        bondageStorageAbi,
        currentCostAbi;

    before(async () => {
        accounts = await webProvider.eth.getAccounts();
        assert.ok(true);
    });
    describe('ZapDispatch Wrapper', () => {

        beforeEach(function (done) {
            setTimeout(() => done(), 500);
        });

        async function prepareData(oracleAddress, dots = 8, dotsToRelease = 4) {
            await deployedZapRegistry.initiateProvider(
                providerPublicKey,
                providerTitle,
                oracleEndpoint,
                params,
                { from: oracleAddress, gas: gasTransaction } // from provider
            );
            await deployedZapRegistry.initiateProviderCurve(
                oracleEndpoint,
                curveType[ZapCurveType],
                curveStart,
                curveMultiplier,
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
                testSubscriber.address,
                tokensForOracle,
                { from: accounts[0], gas: gasTransaction }
            );
            await testSubscriber.bondToOracle(
                oracleAddress,
                oracleEndpoint,
                8,
                { from: accounts[0], gas: gasTransaction }
            );
            await deployedZapArbiter.initiateSubscription(
                oracleAddress,
                oracleEndpoint,
                params,
                providerPublicKey,
                dotsToRelease,
                { from: accounts[0], gas: gasTransaction }
            );
            const contract = new web3.eth.Contract(dispatchAbi.abi, addressZapDispatch);
            const filter = new Promise((resolve, reject) => {
                contract.events.Incoming({ fromBlock: 0, toBlock: 'latest' }, (err, res) => {
                    if (err) return reject(err);
                    if (res) return resolve(res);
                });
            });
            const txHash = testSubscriber.queryTest(
                oracleAddress,
                query,
                oracleEndpoint,
                params,
                { from: accounts[0], gas: gasTransaction }
            );
            const promises = await Promise.all([
                filter,
                txHash
            ]);
            const [
                {
                    returnValues: data,
                    event
                }
            ] = promises;
            if (event !== 'Incoming') assert.ok(false);
            return data;
        }

        async function getNewSmartContracts() {
            dispatchAbi = require(join(__dirname, zapDispatchAbi));
            testSubscriberAbi = require(join(__dirname, zapTestSubscriberAbi));
            tokenAbi = require(join(__dirname, zapTokenAbi));
            arbiterAbi = require(join(__dirname, zapArbiterAbi));
            registryAbi = require(join(__dirname, zapRegistryAbi));
            bondageAbi = require(join(__dirname, zapBondageAbi));
            dispatchStorageAbi = require(join(__dirname, zapDispatchStorageAbi));
            arbiterStorageAbi = require(join(__dirname, zapArbiterStorageAbi));
            registryStorageAbi = require(join(__dirname, zapRegistryStorageAbi));
            bondageStorageAbi = require(join(__dirname, zapBondageStorageAbi));
            currentCostAbi = require(join(__dirname, zapCurrentCostAbi));
            const spacePointer = getInstanceOfSmartContract(
                require(join(__dirname, addressSpacePointerAbi))
            );
            [
                bondageStorage,
                registryStorage,
                arbiterStorage,
                deployedZapToken,
                dispatchStorage
            ] = await Promise.all([
                getNewSmartContract(bondageStorageAbi),
                getNewSmartContract(registryStorageAbi),
                getNewSmartContract(arbiterStorageAbi),
                getNewSmartContract(tokenAbi),
                getNewSmartContract(dispatchStorageAbi)
            ]);
            deployedZapRegistry = await getNewRegistryContract({
                abiFile: registryAbi,
                regStoreAddress: registryStorage.address
            });
            currentCostStorage = await getNewCurrentCostContract({
                abiFile: currentCostAbi,
                pointerAddress: spacePointer.address,
                registryAddress: deployedZapRegistry.address
            });
            deployedZapBondage = await getNewBondageContract({
                abiFile: bondageAbi,
                pointerAddress: spacePointer.address,
                bondStoreAddress: bondageStorage.address,
                tokenAddress: deployedZapToken.address,
                currentCostAddress: currentCostStorage.address
            });
            deployedZapDispatch = await getNewDispatchContract({
                abiFile: dispatchAbi,
                pointerAddress: spacePointer.address,
                dispatchStoreAddress: dispatchStorage.address,
                bondageAddress: deployedZapBondage.address
            });
            deployedZapArbiter = await getNewArbiterContract({
                abiFile: arbiterAbi,
                pointerAddress: spacePointer.address,
                arbiterStoreAddress: arbiterStorage.address,
                bondageAddress: deployedZapBondage.address
            });
            testSubscriber = await getNewTestSubscriberContract({
                abiFile: testSubscriberAbi,
                dispatchAddress: deployedZapDispatch.address,
                bondageAddress: deployedZapBondage.address,
                tokenAddress: deployedZapToken.address
            });
            addressZapDispatch = deployedZapDispatch.address;
            await Promise.all([
                bondageStorage.transferOwnership(deployedZapBondage.address, { from: accounts[0], gas: 6000000 }),
                registryStorage.transferOwnership(deployedZapRegistry.address, { from: accounts[0], gas: 6000000 }),
                arbiterStorage.transferOwnership(deployedZapArbiter.address, { from: accounts[0], gas: 6000000 }),
                dispatchStorage.transferOwnership(deployedZapDispatch.address, { from: accounts[0], gas: 6000000 }),
            ]);
            return Promise.all([
                bondageStorage.owner({ from: accounts[0], gas: 6000000 }),
                registryStorage.owner({ from: accounts[0], gas: 6000000 }),
                arbiterStorage.owner({ from: accounts[0], gas: 6000000 }),
                dispatchStorage.owner({ from: accounts[0], gas: 6000000 })
            ]);
        }

        function getFilter(type) {
            const subscriberContract = new web3.eth.Contract(testSubscriberAbi.abi, testSubscriber.address);
            return new Promise((resolve, reject) => {
                subscriberContract.events[type]({ fromBlock: 0, toBlock: 'latest' }, (err, res) => {
                    if (res) return resolve(res);
                    if (err) return reject(err);
                });
            });
        }

        it('should get instances of smart contract and bind their storages', async () => {
            const data = await getNewSmartContracts();
            assert.equal(data[0]['0'], deployedZapBondage.address);
            assert.equal(data[1]['0'], deployedZapRegistry.address);
            assert.equal(data[2]['0'], deployedZapArbiter.address);
            assert.equal(data[3]['0'], deployedZapDispatch.address);
        });

        it('Should get instance of Zap Dispatch smart contract throw wrapper', () => {
            wrapper = new ZapWrapper(eth);
            zapDispatchWrapper = wrapper.initClass({
                instanceClass,
                address: addressZapDispatch,
                abiPath: dispatchAbi.abi
            });
        });

        it('should call response1 function in Dispatch smart contract', async () => {
            data = await prepareData(accounts[2]);
            const subscribeFilter = getFilter('Result1');
            const queryString = 'pum-tum-pum';
            const respond1 = zapDispatchWrapper.respond({
                queryId: data.id,
                responseParams: [queryString],
                from: data.provider, // from provider
                gas: gasTransaction
            });
            const [logs] = await Promise.all([
                subscribeFilter,
                respond1
            ]);
            assert.equal(logs.returnValues.response1, queryString);
            assert.equal(logs.event, 'Result1');
        });

        it('should call response2 function in Dispatch smart contract', async () => {
            await getNewSmartContracts();
            data = await prepareData(accounts[2]);
            zapDispatchWrapper = wrapper.initClass({
                instanceClass,
                address: addressZapDispatch,
                abiPath: dispatchAbi.abi
            });
            const subscribeFilter = getFilter('Result2');
            const queryStringParams = [
                'pum-tum-pum',
                'param-pam-pam'
            ];
            const respond2 = zapDispatchWrapper.respond({
                queryId: data.id,
                responseParams: queryStringParams,
                from: data.provider, // from provider
                gas: gasTransaction
            });
            const [logs] = await Promise.all([
                subscribeFilter,
                respond2
            ]);
            assert.equal(logs.returnValues.response1, queryStringParams[0]);
            assert.equal(logs.returnValues.response2, queryStringParams[1]);
            assert.equal(logs.event, 'Result2');
        });

        it('should call response3 function in Dispatch smart contract', async () => {
            await getNewSmartContracts();
            data = await prepareData(accounts[2]);
            zapDispatchWrapper = wrapper.initClass({
                instanceClass,
                address: addressZapDispatch,
                abiPath: dispatchAbi.abi
            });
            const subscribeFilter = getFilter('Result3');
            const queryStringParams = [
                'pum-tum-pum',
                'param-pam-pam',
                'tuk-tuk'
            ];
            const respond2 = zapDispatchWrapper.respond({
                queryId: data.id,
                responseParams: queryStringParams,
                from: data.provider, // from provider
                gas: gasTransaction
            });
            const [logs] = await Promise.all([
                subscribeFilter,
                respond2
            ]);
            assert.equal(logs.returnValues.response1, queryStringParams[0]);
            assert.equal(logs.returnValues.response2, queryStringParams[1]);
            assert.equal(logs.returnValues.response3, queryStringParams[2]);
            assert.equal(logs.event, 'Result3');
        });

        it('should call response4 function in Dispatch smart contract', async () => {
            await getNewSmartContracts();
            data = await prepareData(accounts[2]);
            zapDispatchWrapper = wrapper.initClass({
                instanceClass,
                address: addressZapDispatch,
                abiPath: dispatchAbi.abi
            });
            const subscribeFilter = getFilter('Result4');
            const queryStringParams = [
                'pum-tum-pum',
                'param-pam-pam',
                'tuk-tuk',
                'Why-not?'
            ];
            const respond2 = zapDispatchWrapper.respond({
                queryId: data.id,
                responseParams: queryStringParams,
                from: data.provider, // from provider
                gas: gasTransaction
            });
            const [logs] = await Promise.all([
                subscribeFilter,
                respond2
            ]);
            assert.equal(logs.returnValues.response1, queryStringParams[0]);
            assert.equal(logs.returnValues.response2, queryStringParams[1]);
            assert.equal(logs.returnValues.response3, queryStringParams[2]);
            assert.equal(logs.returnValues.response4, queryStringParams[3]);
            assert.equal(logs.event, 'Result4');
        });
    });
});