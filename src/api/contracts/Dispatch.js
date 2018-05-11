
function isPromise(object) {
    if(Promise && Promise.resolve){
        return Promise.resolve(object) === object;
    }else{
        throw "Promise not supported in your environment"
    }
}

class ZapDispatch {

    constructor({web3, contract_address, abi}) {
        this.web3 = web3;
        this.address = contract_address;
        this.abi = abi;
        this.contract = new this.web3.eth.Contract(this.abi, this.address);

        this.isZapDispatch = true;
    }

    // Listen for oracle queries 
    async listen() {
        try {
            const accounts = await this.web3.eth.accounts();
            if (accounts.length == 0) {
                throw new Error("No accounts loaded");
            }

            const account = accounts[0];

            // Create the Event filter
            this.filter = this.contract.events.Incoming();
            // this.filter = new this.contract.filters.Filter({ delay: 500 });
            this.filter.new({ fromBlock: 0, toBlock: 'latest' }, (err, res) => {
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
            if (result.length != 5) {
                throw new Error("Received invalid ZapDataPurchase event");
            }
            const [id, provider, recipient, query, endpoint, endpoint_params] = result;
            // Make sure it is us
            if (provider !== account) {
                return;
            }

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
        switch (responseParams.length) {
            case 1: {
                return this.contract.methods.respond1(
                    queryId,
                    responseParams[0]).send({ 'from': from });
            }
            case 2: {
                return this.contract.methods.respond2(
                    queryId,
                    responseParams[0],
                    responseParams[1]).send({ 'from': from });
            }
            case 3: {
                return this.contract.methods.respond3(
                    queryId,
                    responseParams[0],
                    responseParams[1],
                    responseParams[2]).send({ 'from': from });
            }
            case 4: {
                return this.contract.methods.respond4(
                    queryId,
                    responseParams[0],
                    responseParams[1],
                    responseParams[2],
                    responseParams[3]).send({ 'from': from });
            }
            default: {
                throw new Error("Invalid number of response parameters");
            }
        }
    }
}

module.exports = ZapDispatch;
