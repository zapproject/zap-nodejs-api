const assert = require('assert');
const Curve = require('./Curve');
const Arbiter = require('./../contracts/Arbiter');
const Dispatch = require('./../contracts/Dispatch');
const Registry = require('./../contracts/Registry');
const Bondage = require('./../contracts/Bondage');
const Web3 = require('web3');
const web3 = new Web3();

class Provider {

  constructor({owner, handler}) {
    this.owner = owner;
    this.handler = handler;
    this.pubkey = this.title = this.curve = null;
  }

  get owner(){
    return this.owner;
  }

  get handler() {
    return this.handler;
  }

  set handler(handler) {
    this.handler = handler;
  }

  /**
     *
     * @param pubkey
     * @param title
     * @param endpoint
     * @param params
     * @returns {Promise<any>}
     */
  async create({public_key, title, endpoint, endpoint_params}) {
    try {
      assert(Array.isArray(endpoint_params), 'params need to be an array');
      let provider = await Registry.initiateProvider(
        {public_key, title, endpoint, endpoint_params, from: this.owner});
      assert(provider, 'fail to create provider');
      this.pubkey = public_key;
      this.title = title;
      return provider;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /**
     *
     * @param endpoint
     * @param constants
     * @param parts
     * @param dividers
     * @returns {Promise<*>}
     */
  async initCurve({endpoint, constants, parts, dividers}) {
    try {
      assert((constants instanceof Array
                && parts instanceof Array
                && dividers instanceof Array),
      "curve's arguments need to be array");
      assert(endpoint && constants.length > 0
                && parts.length > 0
                && dividers.length > 0,
      'cant init empty curve args');
      let curve = {constants, parts, dividers};
      // console.log("converted : ", convertedConstants);
      let success = await Registry.initiateProviderCurve({endpoint, curve, from: this.owner});

      assert(success, 'fail to init curve ');
      this.curve = new Curve(constants, parts, dividers);
      return success;
    } catch (err) {
      console.error(err);
      return null;
    }
  }


  /**
     *
     * @returns {Promise<string>}
     */
  async getProviderTitle() {
    try {
      if (this.title) return this.title;
      let title = await Registry.getProviderTitle(this.owner);
      this.title = title;
      return web3.utils.hexToUtf8(title);
    } catch (e){
      console.error(e);
      return null;
    }

  }

  /**
     *
     * @returns {Promise<string>}
     */
  async getProviderPubkey() {
    try {
      if (this.pubkey) return this.pubkey;
      let pubkey = await Registry.getProviderPubkey(this.owner);
      this.pubkey = pubkey;
      return web3.utils.hexToUtf8(pubkey);
    } catch (e){
      console.error('Provider is not initiated');
      return null;
    }
  }

  /**
     *
     * @param endpoint
     * @returns {Promise<*>}
     */
  async getProviderCurve({endpoint}) {
    if (this.curve) return this.curve;
    try {
      let curve = await Registry.getProviderCurve(this.owner, endpoint);
      this.curve = curve;
      return curve;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /**
     *
     * @param endpoint
     * @returns {Promise<any>}
     */
  async getZapBound({endpoint}) {
    assert(endpoint, 'endpoint required');
    let zapBound = await Bondage.getZapBound(this.owner, endpoint);
    return zapBound;
  }

  /**
     *
     * @param endpoint
     * @param dots
     * @returns {Promise<number>}
     */
  async getZapRequired({endpoint, dots}) {
    let zapRequired = await Bondage.calcZapForDots({provider: this.owner, endpoint, dots});
    return parseInt(zapRequired);
  }

  /**
     *
     * @param endpoint
     * @param zapNum
     * @returns {Promise<any>}
     */
  async calcDotsForZap({endpoint, zapNum}) {
    let res = await Bondage.calcBondRate({
      provider: this.owner,
      endpoint,
      zapNum});
    return res;
  }


  /**
     *
     * @param subscriber
     * @param fromBlock
     * @returns {Promise<*>}
     */
  async listenSubscribes({subscriber, fromBlock}) {
    let callback = (error, result) => {
      if (error) {
        console.log(error);
      } else {
        try {
          return this.handler.handleSubscription(result);
        } catch (e) {
          console.error(e);
        }
      }
    };

    Arbiter.listenSubscriptionStart(
      {provider: this.owner, subscriber},
      callback);
  }

  /**
     *
     * @param subscriber
     * @param terminator
     * @param fromBlock
     * @returns {Promise<void>}
     */
  async listenUnsubscribes({subscriber, terminator, fromBlock}) {
    let callback = (error, result) => {
      if (error) {
        console.log(error);
      } else {
        try {
          return this.handler.handleUnsubscription(result);
        } catch (e) {
          console.error(e);
        }
      }
    };

    Arbiter.listenSubscriptionEnd(
      {provider: this.owner, subscriber, terminator, fromBlock},
      callback);
  }

  /**
     *Listen to Queries
     * @param id
     * @param subscriber
     * @param fromBlock
     * @param from
     * @returns {Promise<void>}
     */
  async listenQueries({id, subscriber, fromBlock}, from) {
    let callback = (error, result) => {
      if (error) {
        console.error(error);
      } else {
        try {
          return this.handler.handleIncoming(result);
        } catch (e) {
          console.error(e);
        }
      }
    };

    Dispatch.listen('Incoming',
      {id, provider: this.owner, subscriber, fromBlock},
      callback);
  }

  /**
     *
     * @param queryId
     * @param responseParams
     * @param dynamic
     * @returns {Promise<void>}
     */
  async respond({queryId, responseParams, dynamic}){
    try {
      let res = await Dispatch.respond({queryId, responseParams, dynamic, from: this.owner});
      return res;
    } catch (e){
      console.error(e);
      return null;
    }
  }

}

module.exports = Provider;
