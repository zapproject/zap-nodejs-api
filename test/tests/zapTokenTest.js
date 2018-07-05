const expect = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .expect;

const { ZapToken } = require('../../src/api/contracts/ZapToken');
const BigNumber = require('bignumber.js');
const Web3 = require('web3');
const path = require('path');

const { migrateContracts, ganacheServer, clearBuild, testProvider, testNetworkId } = require('../bootstrap');
const Config = require('../../config/index');
const { tokensForOwner, allocateAccount, getDeployedContract } = require('../utils');

const testArtifactsModulePath = path.join(Config.projectPath, 'test/TestArtifactsModule/contracts');

async function configureEnvironment(func) {
    await func();
}

describe('ZapToken, path to "/src/api/contracts/ZapToken"', () => {
    let addressZapToken;
    let accounts = [];
    let deployedZapToken;
    let abiJSON;
    let zapTokenWrapper;
    let web3;

    before(function (done) {
        configureEnvironment(async () => {
            this.timeout(60000);
            await migrateContracts();
            web3 = new Web3(testProvider);
            accounts = await web3.eth.getAccounts();
            deployedZapToken = await getDeployedContract(Config.testArtifactsDir, 'ZapToken', testNetworkId, web3.currentProvider);
            addressZapToken = deployedZapToken.address;
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
                artifactsPath: testArtifactsModulePath,
                networkId: testNetworkId,
                networkProvider: testProvider
            });
        });

        it('Should get zapToken owner', async () => {
            const owner = await deployedZapToken.owner.call();

            await expect(owner).to.be.equal(accounts[0].toLowerCase());
        });

        it('Should get balance of zapToken from wrapper', async () => {
            const balance = await zapTokenWrapper.balanceOf(accounts[0]);
            await expect(balance.valueOf()).to.be.equal('0');
        });

        it('Should update balance, and get updated balance of zap token', async () => {
            await zapTokenWrapper.allocate({
                to: accounts[0],
                amount: tokensForOwner,
                from: accounts[0]
            });
            const balance = await zapTokenWrapper.balanceOf(accounts[0]);

            let first = web3.utils.toBN(balance.valueOf()).div(web3.utils.toBN(10).pow(web3.utils.toBN(30))).toString();
            let second = tokensForOwner.div(web3.utils.toBN(10).pow(web3.utils.toBN(30))).toString();
            await expect(first).to.be.equal(second);
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