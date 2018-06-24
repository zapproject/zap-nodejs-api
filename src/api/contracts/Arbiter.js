const Base = require('./Base');
class Arbiter extends Base {

    constructor(){
        super(Base.getConfig().arbiterArtifact)
    }
    // Initiate a subscription
    async initiateSubscription({oracleAddress, endpoint, js_params, dots, publicKey, from, gas}) {
        try {
            // Make sure we could parse it correctly
            if (js_params instanceof Error) {
                throw js_params;
            }

            return await this.contract.initiateSubscription(
                oracleAddress,
                endpoint,
                js_params,
                publicKey,
                dots,
                {from: from, gas: gas}
            );
        } catch (err) {
            throw err;
        }
    }

    listenSubscriptionEnd(filters,callback){
        try {
            // Specify filters and watch Incoming event
            let filter = this.contract.DataSubscriptionEnd(
                filters,
                { fromBlock: filters.fromBlock ? filters.fromBlock : 0, toBlock: 'latest' });
            filter.watch(callback);
        } catch (err) {
            throw err;
        }
    }

    listenSubscriptionStart(filters,callback){
        try {
            // Specify filters and watch Incoming event
            let filter = this.contract.DataPurchase(
                filters,
                { fromBlock: filters.fromBlock ? filters.fromBlock : 0, toBlock: 'latest' });
            filter.watch(callback);
        } catch (err) {
            throw err;
        }
    }


}

module.exports = Arbiter;
