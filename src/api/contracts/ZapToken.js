const Eth = require('ethjs');

class ZapToken {
    constructor({ eth, contract_address, abiFile }) {
        this.eth = eth;
        this.token_address = contract_address;
        this.abiFile = abiFile;
        this.token_contract = eth.contract(abiFile).at(this.token_address);
    }

    // Get our address
    async getAddress() {
        try {
            const accounts = await this.eth.accounts();
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
            return await this.token_contract.balanceOf(address);
        } catch (err) {
            throw err;
        }
    }

    async balanceOf(addr) {
        try {
            return await this.token_contract.balanceOf(addr);
        } catch (err) {
            throw err;
        }
    }

    // Send Zap around
    async send({destination, amount, from}) {
        try {
            amount = Eth.toBN(amount);
            return await this.token_contract.transfer(destination, amount, { from });
        } catch (err) {
            throw err;
        }
    }

    // allocate tokens, must be called only from owner account
    async allocate(to, amount, from) {
        try {
            amount = Eth.toBN(amount);
            return await this.token_contract.allocate(to, amount, {from: from});
        } catch (err) {
            throw err;
        }
    }

    // Approve a certain amount of zap to be sent
    async approve({ address, amount, from }) {
        // Approve to the token contract the spending
        try {
            amount = Eth.toBN(amount);
            const success = await this.token_contract.approve(address, amount, { from });
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
