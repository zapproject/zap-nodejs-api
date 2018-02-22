const zapToken = require('../../src/api/contracts/ZapToken');
const assert = require("chai").assert;
const {
    migrateContracts,
    ganacheProvider,
    webProvider
} = require('../bootstrap');
const { 
    zapTokenAbi
} = require('../../config');
const contract = require('truffle-contract');
const path = require('path');

describe('ZapToken, path to "/src/api/contracts/ZapToken"', () => {
    let addressZapToken;
    let accounts = [];
    let deployedZapToken;

    before(async function() {
        this.timeout(60000);
        const data = await migrateContracts();
        assert.equal(data, 'done');
        const abiJSON = require(path.join(__dirname, zapTokenAbi));
        const zapToken = contract(abiJSON);
        zapToken.setProvider(ganacheProvider);
        deployedZapToken = await zapToken.deployed();
        addressZapToken = deployedZapToken.address;
        accounts = await webProvider.eth.getAccounts();
        assert.ok(true);
    });

    it('should get balance of zapToken', async () => {
        const data  = await deployedZapToken.balanceOf.call(accounts[0], { from: accounts[0] });
        assert.equal(parseInt(data.toString()), 0);
    });

    // describe('zapTokenWrapper', function () {

    // });

    after(() => {
        closeServer();
    });
});