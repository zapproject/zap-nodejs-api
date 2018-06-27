const Base = require('./Base');
const Web3 = require('web3');
const web3 = new Web3();

class ZapRegistry extends Base {

  constructor(){
    super(Base.getConfig().registryArtifact);
  }

  async initiateProvider({public_key, title, endpoint, endpoint_params, from, gas}) {
    try {
      return await this.contract.methods.initiateProvider(
        public_key,
        title,
        endpoint,
        endpoint_params)
        .send({
          from: from,
          gas: gas || this.DEFAULT_GAS,
        }
        );
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
        this.web3.utils.utf8ToHex(endpoint),
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
      let endpoint_params = [];
      params.forEach(el => endpoint_params.push(web3.utils.utf8ToHex(el)));
      return await this.contract.methods.setEndpointParams(
        endpoint,
        endpoint_params).send({
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
      this.web3.utils.utf8ToHex(endpoint),
      this.web3.utils.toBN(index)
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

module.exports = new ZapRegistry();
