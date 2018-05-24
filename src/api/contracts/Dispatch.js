const Base = require('./Base');

function isPromise(object) {
    if (Promise && Promise.resolve) {
        return Promise.resolve(object) === object;
    } else {
        throw "Promise not supported in your environment"
    }
}

class ZapDispatch extends Base {

    /**
     * Listen for oracle queries
     *
     * @param filters event filters
     * @param callback callback function that will be called after event received
     */
    async listen(filters, callback) {
        try {
            const contract = await super.contractInstance();

            // Specify filters and watch Incoming event
            this.filter = contract.Incoming(filters, { fromBlock: filters.fromBlock ? filters.fromBlock : 0, toBlock: 'latest' });
            this.filter.watch(callback);
        } catch (err) {
            throw err;
        }
    }

    // Close the connection
    close() {
        if (this.filter) {
            this.filter.stopWatching();
            delete this.filter;
        }
    }

    async respond(queryId, responseParams, from) {
        if (isPromise(responseParams)) {
            responseParams = await responseParams;
        }
        const contract = await super.contractInstance();
        switch (responseParams.length) {
            case 1: {
                return contract.respond1(
                    queryId,
                    responseParams[0], { from: from });
            }
            case 2: {
                return contract.respond2(
                    queryId,
                    responseParams[0],
                    responseParams[1], { from: from });
            }
            case 3: {
                return contract.respond3(
                    queryId,
                    responseParams[0],
                    responseParams[1],
                    responseParams[2], { from: from });
            }
            case 4: {
                return contract.respond4(
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
