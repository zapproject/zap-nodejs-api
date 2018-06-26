const Base = require('./Base');

class ZapToken extends Base {

    constructor(){
        super(Base.getConfig().zapTokenArtifact)
    }
    async balanceOf(address) {
        return await this.contract.methods.balanceOf(address).call();
    }

    async send({destination, amount, from}) {
        return await this.contract.methods.transfer(destination, amount).send({from});
    }

    async allocate(to, amount, from) {
        return await this.contract.methods.allocate(to, amount).send({from: from});
    }

    async approve({address, amount, from}) {
        const success = await this.contract.methods.approve(address, amount).send({from: from});
        if (!success) {
            throw new Error("Failed to approve Bondage transfer");
        }
        return success;
    }
}

module.exports = ZapToken;
