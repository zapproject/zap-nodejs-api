const Eth = require('ethjs');
const { getABI } = require('../utils.js');

class ZapToken {
    constructor(eth, network, contractAddress) {
        this.eth = eth;
        this.address = getAddress("ZapToken", network, contractAddress);
        this.abiFile = getABI("ZapToken");
        this.token_contract = eth.contract(abiFile).at(this.token_address);
    }

    // Get our address
    async getAddress() {
        try{
            const accounts = await this.eth.accounts();
            if(!accounts.length) {
                throw new Error('No accounts loaded');
            }
            return accounts[0];
        } catch(err) {
            throw err;
        }
    }
    
    async getBalance() {
        try {
            const address = await this.getAddress();
            return  await this.token_contract.balanceOf(address);
        } catch(err) {
            throw err;
        }
    }

    // Send Zap around
    async send({ destination, amount, from }) {
        try {
            amount = Eth.toBN(amount);
            return await this.token_contract.transfer(destination, amount, { from });
        } catch(err) {
            throw err;
        }
    }

    // Approve a certain amount of zap to be sent
    async approve({ address, amount, from }) {
        // Approve to the token contract the spending
        try {
            amount = Eth.toBN(amount);
            const success = await this.token_contract.approve(address, amount, { from });
            if ( !success ) {
                throw new Error("Failed to approve Bondage transfer");
            }
            return success;
        } catch(err) {
            throw err;
        }
    }
}

module.exports = ZapToken;
