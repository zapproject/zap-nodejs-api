const Base = require('./Base');

class ZapToken extends Base {
    constructor(){
        super(Base.getConfig().zapTokenArtifact)
    }
    async balanceOf(address) {
        try {
            return await this.contract.balanceOf(address);
        } catch (err) {
            throw err;
        }
    }

    // Send Zap around
    async send({destination, amount, from}) {
        try {
            return await this.contract.transfer(destination, amount, {from});
        } catch (err) {
            throw err;
        }
    }

    // allocate tokens, must be called only from owner account
    async allocate(to, amount, from) {
        try {
            return await this.contract.allocate(to, amount, {from: from});
        } catch (err) {
            throw err;
        }
    }

    // Approve a certain amount of zap to be sent
    async approve({address, amount, from}) {
        // Approve to the token contract the spending
        try {
            const success = await this.contract.approve(address, amount, {from: from});
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
