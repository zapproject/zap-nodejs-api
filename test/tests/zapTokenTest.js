const instanceClass = require('../../src/api/contracts/ZapToken');
const ZapWrapper = require('../../src/api/ZapWrapper');
const BigNumber = require('bignumber.js');
const assert = require("chai").assert;
const {
    migrateContracts,
    webProvider,
    eth
} = require('../bootstrap');
const {
    zapTokenAbi,
    network_id
} = require('../../config');
const path = require('path');
const zapTokenAbiFile = require(path.join(__dirname, '../../src/contracts/abis/ZapToken.json'));
const { 
    tokensForOwner,
    allocateAccount
} = require('../utils');


describe('ZapToken, path to "/src/api/contracts/ZapToken"', () => {
    let addressZapToken;
    let accounts = [];
    let deployedZapToken;
    let abiJSON;
    let zapTokenWrapper;

    before(async function () {

        this.timeout(60000);
        const data = await migrateContracts();
        assert.equal(data, 'done');
        abiJSON = require(path.join(__dirname, zapTokenAbi));
        addressZapToken = abiJSON.networks[network_id].address;
        deployedZapToken = eth.contract(abiJSON.abi).at(addressZapToken);
        accounts = await webProvider.eth.getAccounts();
        assert.ok(true);

    });

    it('should get balance of zapToken', async () => {
        const { balance } = await deployedZapToken.balanceOf( accounts[0], { from: accounts[0], gas: new BigNumber('6e6') });
        assert.equal(parseInt(balance.toString()), 0);
    });

    describe('zapTokenWrapper', function () {

        beforeEach(function (done) {
            setTimeout(() => done(), 500);
        });

        it('should initiate wrapper', () => {
            const wrapper = new ZapWrapper(eth);
            zapTokenWrapper = wrapper.initClass({
                instanceClass,
                address: addressZapToken,
                abiPath: zapTokenAbiFile
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

        it('Should update balance, and get updated balance of zap token', async () => {
            await zapTokenWrapper.token_contract.allocate(
                accounts[0],
                tokensForOwner,
                { from: accounts[0] }
            );
            const { balance } = await zapTokenWrapper.getBalance();
            assert.equal(+tokensForOwner.toString(), balance.toString());
        });

        it('Should make transfer to another account', async () => {
            await zapTokenWrapper.send({ 
                destination: accounts[1],
                amount: allocateAccount,
                from: accounts[0]
            });
            const { balance } = await zapTokenWrapper.token_contract.balanceOf(accounts[1]);
            assert.equal(balance.toString(), allocateAccount);
        });

        it('Should approve to transfer from one to the another account', async () => {
            await zapTokenWrapper.approve({
                address: accounts[2],
                amount: allocateAccount, 
                from: accounts[0]
            });
        });
    });
});