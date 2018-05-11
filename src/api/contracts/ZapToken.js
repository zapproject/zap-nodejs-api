const Eth = require('ethjs');

class ZapToken {
    constructor({ web3, contract_address, abi }) {
        this.eth = eth;
        this.token_address = contract_address;
        this.abi = abi;
        this.contract = new this.web3.eth.Contract(this.abi, this.address);
    }

    // Get our address
    async getAddress() {
        try {
            const accounts = await this.web3.eth.getAccounts();
            if (!accounts.length) {
                throw new Error('No accounts loaded');
            }
            return accounts[0];
        } catch (err) {
            throw err;
        }
    }

    async getBalance() {
        try {
            const address = await this.getAddress();
            return await this.token_contract.methods.balanceOf(address).call();
        } catch (err) {
            throw err;
        }
    }

    async balanceOf(addr) {
        try {
            return await this.token_contract.methods.balanceOf(addr).call();
        } catch (err) {
            throw err;
        }
    }

    // Send Zap around
    async send({destination, amount, from}) {
        try {
            amount = Eth.toBN(amount);
            return await this.token_contract.methods.transfer(destination, amount).send({ from });
        } catch (err) {
            throw err;
        }
    }

    // allocate tokens, must be called only from owner account
    async allocate(to, amount, from) {
        try {
            amount = Eth.toBN(amount);
            return await this.token_contract.methods.allocate(to, amount).send( {from: from});
        } catch (err) {
            throw err;
        }
    }

    // Approve a certain amount of zap to be sent
    async approve({ address, amount, from }) {
        // Approve to the token contract the spending
        try {
            amount = Eth.toBN(amount);
            const success = await this.token_contract.methods.approve(address, amount).send( { from });
            if (!success) {
                throw new Error("Failed to approve Bondage transfer");
            }
            return success;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = ZapToken;
