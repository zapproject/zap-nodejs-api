class ZapDispatch {
    constructor({ eth, contract_address, abiFile }) {
        this.eth = eth;
        this.address = contract_address;
        this.abiFile = abiFile;
        this.contract = eth.contract(this.abiFile).at(this.address);
    }

    // Listen for oracle queries 
    async listen() {
        try {
            const accounts = await this.eth.accounts();
            if (accounts.length == 0) {
                throw new Error("No accounts loaded");
            }

            const account = accounts[0];

            // Create the Event filter
            this.filter = new this.contract.filters.Filter({ delay: 500 });
            await this.filter.new({ toBlock: 'latest' });
            // this.filter = this.contract.Incoming().new((err, res) => {
            //     if (err) {
            //         throw err;
            //     }
            // });

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

    async respond(queryId, responseParams) {
        switch (responseParams.length) {
            case 1: {
                return this.contract.respond1(
                    queryId,
                    responseParams[0]
                );
            }
            case 2: {
                return this.contract.respond2(
                    queryId,
                    responseParams[0],
                    responseParams[1]
                );
            }
            case 3: {
                return this.contract.respond3(
                    queryId,
                    responseParams[0],
                    responseParams[1],
                    responseParams[2]
                );
            }
            case 4: {
                return this.contract.respond4(
                    queryId,
                    responseParams[0],
                    responseParams[0],
                    responseParams[0],
                    responseParams[0]
                );
            }
            default: {
                throw new Error("Invalid number of response parameters");
            }
        }
    }
}

module.exports = ZapDispatch;
