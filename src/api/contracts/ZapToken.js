const Base = require('./Base');

class ZapToken extends Base {
    async balanceOf(address) {
        try {
            const contractInstance = await this.contractInstance();
            return await contractInstance.balanceOf(address);
        } catch (err) {
            throw err;
        }
    }

    // Send Zap around
    async send({destination, amount, from}) {
        try {
            const contractInstance = await this.contractInstance();
            return await contractInstance.transfer(destination, amount, {from});
        } catch (err) {
            throw err;
        }
    }

    // allocate tokens, must be called only from owner account
    async allocate(to, amount, from) {
        try {
            const contractInstance = await this.contractInstance();
            return await contractInstance.allocate(to, amount, {from: from});
        } catch (err) {
            throw err;
        }
    }

    // Approve a certain amount of zap to be sent
    async approve({address, amount, from}) {
        // Approve to the token contract the spending
        try {
            const contractInstance = await this.contractInstance();
            const success = await contractInstance.approve(address, amount, {from: from});
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
