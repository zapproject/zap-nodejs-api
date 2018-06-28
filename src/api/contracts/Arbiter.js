const Base = require('./Base');
const {utf8ToHex, toBN} = require('web3-utils');

class Arbiter extends Base {

  constructor({artifactsModule={},networkId = {}, networkProvider = {}}){
    super({'Arbiter', artifactsModule, networkId, networkProvider});
  }

  /**
     *
     * @param provider
     * @param endpoint
     * @param endpointParams
     * @param blocks
     * @param publicKey
     * @param from
     * @param gas
     * @returns {Promise<any>}
     */
  async initiateSubscription(
    {provider, endpoint, endpointParams, blocks, publicKey, from, gas}) {
    try {
      // Make sure we could parse it correctly
      if (endpointParams instanceof Error) {
        throw endpointParams;
      }
      for (let i in endpointParams){
        endpointParams[i] = utf8ToHex(endpointParams[i]);
      }

      return await this.contract.methods.initiateSubscription(
        provider,
        utf8ToHex(endpoint),
        endpointParams,
        toBN(publicKey),
        toBN(blocks)).send({from: from, gas: gas});
    } catch (err) {
      throw err;
    }
  }

  async endSubscription({provider, endpoint, from, gas}) {
    try {
      return await this.contract.methods.endSubscriptionSubscriber(
        provider,
        utf8ToHex(endpoint))
        .send({from: from, gas: gas});
    } catch (err) {
      throw err;
    }
  }

  /**
     *
     * @param filters
     * @param callback
     */
  listenSubscriptionEnd(filters, callback){
    try {
      // Specify filters and watch Incoming event
      let filter = this.contract.events
        .DataSubscriptionEnd(
          filters,
          { fromBlock: filters.fromBlock ? filters.fromBlock : 0, toBlock: 'latest' });
      filter.watch(callback);
    } catch (err) {
      throw err;
    }
  }

  /**
     *
     * @param filters
     * @param callback
     */
  listenSubscriptionStart(filters, callback){
    try {
      // Specify filters and watch Incoming event
      let filter = this.contract.events.DataPurchase(
        filters,
        { fromBlock: filters.fromBlock ? filters.fromBlock : 0, toBlock: 'latest' });
      filter.watch(callback);
    } catch (err) {
      throw err;
    }
  }


  /**
     * Listen to all events
     * @param callback
     */
  listen(callback){
    this.contract.events.allEvents({fromBlock: 0, toBlock: 'latest'}, callback);
  }


}

module.exports = new Arbiter();
