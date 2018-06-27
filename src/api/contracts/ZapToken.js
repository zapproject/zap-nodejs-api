const Base = require('./Base');
const {toBase,fromBase} = require('./../utils')

class ZapToken extends Base {

  constructor(){
    super(Base.getConfig().zapTokenArtifact);
  }
  async balanceOf(address) {
    let balance = await this.contract.methods.balanceOf(address).call();
    return fromBase(balance);
  }

  async send({destination, amount, from}) {
    let bigAmount = toBase(amount)
    return await this.contract.methods.transfer(destination, bigAmount).send({from});
  }

  async allocate({to, amount, from}) {
    let bigAmount = toBase(amount)
    return await this.contract.methods.allocate(to, bigAmount).send({from: from});
  }

  async approve({address, amount, from}) {
    let bigAmount = toBase(amount)
    const success = await this.contract.methods.approve(address, bigAmount).send({from: from});
    if (!success) {
      throw new Error('Failed to approve Bondage transfer');
    }
    return success;
  }
}

module.exports = new ZapToken();
