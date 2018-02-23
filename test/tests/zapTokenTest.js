const instanceClass = require('../../src/api/contracts/ZapToken');
const assert = require("chai").assert;
const {
    migrateContracts,
    ganacheProvider,
    webProvider
} = require('../bootstrap');
const { 
    zapTokenAbi,
    port,
    protocol,
    endpoint
} = require('../../config');
const contract = require('truffle-contract');
const path = require('path');
const Eth = require('ethjs');
const endpointTest = `${protocol}${endpoint}:${port}`;
const eth = new Eth(new Eth.HttpProvider(endpointTest));
const ZapWrapper = require('../../src/api/ZapWrapper');

describe('ZapToken, path to "/src/api/contracts/ZapToken"', () => {
    let addressZapToken;
    let accounts = [];
    let deployedZapToken;
    let zapToken;
    let abiJSON;
    let zapTokenWrapper;

    before(async function() {
        this.timeout(60000);
        const data = await migrateContracts();
        assert.equal(data, 'done');
        abiJSON = require(path.join(__dirname, zapTokenAbi));
        zapToken = contract(abiJSON);
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

    describe('zapTokenWrapper', function () {

        it('should initiate wrapper', () => {
            const wrapper = new ZapWrapper(eth);
            zapTokenWrapper = wrapper.initClass({
                instanceClass,
                address: addressZapToken,
                abiPath: abiJSON.abi
            });
        });

        it('Should get zapToken address from wrapper', async () => {
            const account = await zapTokenWrapper.getAddress();
            assert.equal(account, accounts[0].toLowerCase());
            assert.equal(account.length, accounts[0].length);
        });

        it('should get balance of zapToken from wrapper', async () => {
            const { balance } = await zapTokenWrapper.getBalance();
            assert.equal(balance.toString(), 0);
        });

    });

    // after(() => {
    //     closeServer();
    // });
});