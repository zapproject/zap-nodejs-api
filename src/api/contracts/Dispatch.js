const Base = require('./Base');
const config = require("./../../../config/index")
function isPromise(object) {
    if (Promise && Promise.resolve) {
        return Promise.resolve(object) === object;
    } else {
        throw "Promise not supported in your environment"
    }
}

class ZapDispatch extends Base {

    constructor(){
        super(config.dispatchArtifact)
    }

    async queryData({provider,query,endpoint,params,onchainProvider,onchainSubscriber}){
        let resultQuery = await this.contract.methods.query(
            provider,
            query,
            this.web3.utils.utf8ToHex(endpoint),
            params,   // endpoint-specific params
            onchainProvider,
            onchainSubscriber).send({from:this.owner,gas:6000000});
        return resultQuery;
    }
    /**
     * Listen for oracle queries
     *
     * @param filters event filters
     * @param callback callback function that will be called after event received
     */
    listen(eventName,filters, callback) {
        try {
            // Specify filters and watch Incoming event
            this.filter = this.contract[eventName](filters, { fromBlock: filters.fromBlock ? filters.fromBlock : 0, toBlock: 'latest' });
            this.filter.watch(callback);
        } catch (err) {
            throw err;
        }
    }

    // Close the connection
    close(filter) {
        if (filter) {
            filter.stopWatching();
        }
    }

    async respond(queryId, responseParams,dynamicResponse, from) {
        if (isPromise(responseParams)) {
            responseParams = await responseParams;
        }
        if(dynamicResponse){
            return this.contract.respondBytes32Array(
                queryId,
                responseParams,
                {from:from}
            )
        }
        switch (responseParams.length) {
            case 1: {
                return this.contract.respond1(
                    queryId,
                    responseParams[0], { from: from });
            }
            case 2: {
                return this.contract.respond2(
                    queryId,
                    responseParams[0],
                    responseParams[1], { from: from });
            }
            case 3: {
                return this.contract.respond3(
                    queryId,
                    responseParams[0],
                    responseParams[1],
                    responseParams[2], { from: from });
            }
            case 4: {
                return this.contract.respond4(
                    queryId,
                    responseParams[0],
                    responseParams[1],
                    responseParams[2],
                    responseParams[3], { from: from });
            }
            default: {
                throw new Error("Invalid number of response parameters");
            }
        }
    }


}

module.exports = ZapDispatch;
