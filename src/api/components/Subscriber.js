const EventEmitter = require('events');
const assert = require('assert');
const Arbiter = require('./../contracts/Arbiter');
const Registry = require('./../contracts/Registry');
const Bondage = require('./../contracts/Bondage');
const Dispatch = require('./../contracts/Dispatch');
const ZapToken = require('./../contracts/ZapToken');

class Subscriber extends EventEmitter {

  constructor({owner, handler}) {
    super();
    assert(owner, 'owner address is required');
    this.owner = owner;
    this.handler = handler || {};
  }

  // Add a endpoint handler
  addHandler(type, handler) {
    this.handlers[type] = handler;
  }


  async bond({provider, endpoint, zapNum}){
    assert(provider && endpoint && zapNum,
      'missing args, require: provider,endpoint,zapNum');
    assert(this.hasEnoughZap(zapNum), 'Insufficient Balance');
    let approve = await ZapToken.approve({
      address: Bondage.contract._address,
      amount: zapNum, from: this.owner});
    assert(approve, 'fail to approve to Bondage');
    let bonded = await Bondage.bond({provider, endpoint, zapNum, from: this.owner});
    return bonded;
  }

  async unBond({provider, endpoint, dots}){
    let boundDots = await Bondage.getBoundDots({subscriber: this.owner, provider, endpoint});
    assert(boundDots >= dots, 'dots to unbond is less than requested');
    let unBounded = await Bondage.unbond({provider, endpoint, dots, from: this.owner});
    return unBounded;
  }


  async subscribe({provider, endpoint, endpointParams, dots}) {
    try {
      let providerPubkey = await Registry.getProviderPublicKey({provider});
      let zapRequired = await Bondage.calcZapForDots({provider, endpoint, dots});
      let zapBalance = await ZapToken.balanceOf(this.owner);
      if (zapBalance < zapRequired)
        throw new Error(`Insufficient balance, require ${zapRequired} Zap for ${dots} dots`);
      let boundDots = await Bondage.bond({provider, endpoint, numZap: zapRequired, from: this.owner});
      assert.isEqual(boundDots, dots, 'Bound dots is different to dots requests.');
      let blocks = dots;
      let sub = await Arbiter.initiateSubscription(
        {provider, endpoint, endpointParams,
          blocks: blocks, publicKey: providerPubkey, from: this.owner});
      return sub;
    } catch (e){
      console.error(e);
      return null;
    }
  }

  // === Helpers ===//
  async hasEnoughZap(zapRequired){
    let balance = await ZapToken.balanceOf(this.owner);
    return balance > zapRequired;
  }

}

module.exports = Subscriber;
