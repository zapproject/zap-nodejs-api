const Base = require('./Base');

function isPromise(object) {
    if (Promise && Promise.resolve) {
        return Promise.resolve(object) === object;
    } else {
        throw "Promise not supported in your environment"
    }
}

class ZapDispatch extends Base {

    // Listen for oracle queries 
    async listen(providerAddress) {
        try {
            const contract = await super.contractInstance();

            // Create the Event filter
            this.filter = contract.events.Incoming();

            this.filter.new({ provider: providerAddress }, { fromBlock: 0, toBlock: 'latest' }, (err, res) => {
                if (err) throw err;
            });

            // Watch the event filter
            const result = await new Promise((resolve, reject) => {
                this.filter.watch((err, res) => {
                    if (err) return reject(err);
                    if (res) return resolve(res);
                });
            });

            // Sanity check
            if (result.length !== 5) {
                throw new Error("Received invalid ZapDataPurchase event");
            }
            const [id, provider, recipient, query, endpoint, endpoint_params] = result;

            // Emit event
            return {
                id,
                provider,
                recipient,
                query,
                endpoint,
                endpoint_params
            };
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
                    responseParams[0], { 'from': from });
            }
            case 2: {
                return contract.respond2(
                    queryId,
                    responseParams[0],
                    responseParams[1], { 'from': from });
            }
            case 3: {
                return contract.respond3(
                    queryId,
                    responseParams[0],
                    responseParams[1],
                    responseParams[2], { 'from': from });
            }
            case 4: {
                return contract.respond4(
                    queryId,
                    responseParams[0],
                    responseParams[1],
                    responseParams[2],
                    responseParams[3], { 'from': from });
            }
            default: {
                throw new Error("Invalid number of response parameters");
            }
        }
    }
}

module.exports = ZapDispatch;
