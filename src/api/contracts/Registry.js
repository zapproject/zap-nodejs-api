const Base = require('./Base');
const Web3 = require('web3');
const web3 = new Web3();
const {utf8ToHex, toBN, toHex} = require('web3-utils');


class ZapRegistry extends Base {

  constructor({artifactsPath = null, networkId = null, networkProvider = null} = {}){
      super({
          contractName: 'Registry',
          _artifactsPath: artifactsPath,
          _networkId: networkId,
          _provider: networkProvider
      });
  }

  async initiateProvider({public_key, title, endpoint, endpoint_params, from, gas}) {
    try {
      return await this.contract.methods.initiateProvider(
        public_key,
        utf8ToHex(title),
        utf8ToHex(endpoint),
        utf8ArrayToHex(endpoint_params)
      )
      .send({
        from: from,
        gas: gas || this.DEFAULT_GAS
      });
    } catch (err) {
      throw err;
    }
  }

  async initiateProviderCurve({endpoint, curve, from, gas}) {
    try {
      let convertedConstants = curve.constants.map(item => {
        return web3.utils.toHex(item);
      });
      let convertedParts = curve.parts.map(item => {
        return web3.utils.toHex(item);
      });
      let convertedDividers = curve.dividers.map(item => {
        return web3.utils.toHex(item);
      });
      return await this.contract.methods.initiateProviderCurve(
        utf8ToHex(endpoint),
        convertedConstants,
        convertedParts,
        convertedDividers)
        .send({
          from: from,
          gas: gas || this.DEFAULT_GAS,
        });
    } catch (err) {
      throw err;
    }
  }

  async setEndpointParams({endpoint, params, from, gas}) {
    try {
      return await this.contract.methods.setEndpointParams(
        utf8ToHex(endpoint),
        utf8ArrayToHex(params)).send({
        from: from,
        gas: gas || this.DEFAULT_GAS,
      });
    } catch (err) {
      throw err;
    }
  }

  async getProviderPublicKey({provider}){
    return await this.contract.methods.getProviderPublicKey(provider).call();
  }

  /**
     *
     * @param provider
     * @returns {Promise<any>}
     */
  async getProviderTitle({provider}){
    return await this.contract.methods.getProviderTitle(provider).call();
  }

  /**
     *
     * @param provider address
     * @returns {Promise<any>}
     */
  async getProviderCurve({provider}){
    return await this.contract.methods.getProviderCurve.call(provider).call();
  }

  /**
     *
     * @param index
     * @returns {Promise<any>}
     */
  async getNextProvider({index}){
    return await this.contract.methods.getNextProvider(index).call();
  }

  /**
     *
     * @param provider
     * @param endpoint
     * @param index
     * @returns {Promise<any>}
     */
  async getNextEndpointParams({provider, endpoint, index}){
    return this.contract.methods.getNextEndpointParam(
      provider,
      utf8ToHex(endpoint),
      toBN(index)
    ).call();
  }

  // ==== Events ====//

  async listen(filters, callback){
    this.contract.events.allEvents(filters, callback);
  }

  async listenNewProvider(filters, callback){
    this.contract.events.NewProvider(filters, callback);
  }

  async listenNewCurve({provider}, callback){
    this.contract.events.NewCurve(provider, callback);
  }


}

function utf8ArrayToHex(arr) {
    if (!arr) return [];
    if (arr.length <= 0) return arr;

    let newArr = [];
    for (let i = 0; i < arr.length; i++) {
        newArr[i] = utf8ToHex(arr[i]);
    }

    return newArr;
}

function getDefaultInstance() {
    return new ZapRegistry({});
}

module.exports = {
    getDefaultInstance,
    ZapRegistry
};

