const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .expect;

const ZapToken = require('../../src/api/contracts/ZapToken');
const BigNumber = require('bignumber.js');
const Web3 = require('web3');
const path = require('path');
const fs = require('fs');

const { migrateContracts, ganacheServer, clearBuild } = require('../bootstrap');
const { zapTokenAbi, ganacheNetwork, contractsBuildDirectory } = require('../../config');
const { tokensForOwner, allocateAccount, getDeployedContract } = require('../utils');

const currentNetwork = ganacheNetwork;
const web3 = new Web3(new Web3.providers.WebsocketProvider(currentNetwork.address));

async function configureEnvironment(func) {
    await func();
}

describe('ZapToken, path to "/src/api/contracts/ZapToken"', () => {
    let addressZapToken;
    let accounts = [];
    let deployedZapToken;
    let abiJSON;
    let zapTokenWrapper;
    let startOwnerBalance;

    before(function (done) {
        configureEnvironment(async () => {
            this.timeout(60000);
            await migrateContracts();

            accounts = await web3.eth.getAccounts();
            abiJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '../' + zapTokenAbi)));
            addressZapToken = abiJSON.networks[currentNetwork.id].address;
            deployedZapToken = await getDeployedContract(abiJSON, currentNetwork, web3.currentProvider);

            done();
        });
    });

    it('should get balance of zapToken', async () => {
        const balance = await deployedZapToken.balanceOf( accounts[0], { from: accounts[0], gas: new BigNumber('6e6') });
        await expect(balance.valueOf()).to.be.equal('0');
    });

    describe('ZapToken', function () {

        it('Should initiate wrapper', () => {
            zapTokenWrapper = new ZapToken({
                provider: web3.currentProvider,
                address: addressZapToken,
                artifact: abiJSON
            });
        });

        it('Should get zapToken owner', async () => {
            const c = await zapTokenWrapper.contractInstance();
            const owner = await c.owner.call();

            await expect(owner).to.be.equal(accounts[0].toLowerCase());
        });

        it('Should get balance of zapToken from wrapper', async () => {
            const balance = await zapTokenWrapper.balanceOf(accounts[0]);
            await expect(balance.valueOf()).to.be.equal('0');
        });

        it('Should update balance, and get updated balance of zap token', async () => {
            await zapTokenWrapper.allocate(accounts[0], tokensForOwner, accounts[0]);
            const balance = await zapTokenWrapper.balanceOf(accounts[0]);

            await expect(balance.valueOf()).to.be.equal(tokensForOwner.toString());
        });

        it('Should make transfer to another account', async () => {
            await zapTokenWrapper.send({ 
                destination: accounts[1],
                amount: allocateAccount,
                from: accounts[0]
            });
            const balance = await zapTokenWrapper.balanceOf(accounts[1]);

            await expect(balance.valueOf()).to.be.equal(allocateAccount.toString());
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