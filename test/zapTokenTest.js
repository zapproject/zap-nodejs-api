const zapToken = require('../src/api/contracts/ZapToken');
const assert = require("chai").assert;
const {
    migrateContracts,
    ganacheProvider,
    webProvider
} = require('./bootstrap');
const { 
    runMigrationTimeOut,
    zapTokenAbi
} = require('../config');
const contract = require('truffle-contract');
const path = require('path');

describe('ZapToken', () => {
    let addressZapToken;
    let accounts = [];
    let deployedZapToken;
    it('Should run migration', async () => {
        const data = await migrateContracts();
        assert.equal(data, 'done');
    }).timeout(runMigrationTimeOut);

    it('should get zapToken address of contract and accounts', async () => {
        const abiJSON = require(path.join(__dirname, zapTokenAbi));
        const zapToken = contract(abiJSON);
        zapToken.setProvider(ganacheProvider);
        deployedZapToken = await zapToken.deployed();
        addressZapToken = deployedZapToken.address;
        accounts = await webProvider.eth.getAccounts();
        assert.ok(true);
    });

    it('should get balance of zaptoken', async () => {
        const data  = await deployedZapToken.balanceOf.call(accounts[0], { from: accounts[0] });
        assert.equal(parseInt(data.toString()), 0);
    });

    after(() => {
        closeServer();
    });
});