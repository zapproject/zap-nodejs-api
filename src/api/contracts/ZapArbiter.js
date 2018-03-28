const Eth = require('ethjs');
const fs = require('fs');
const { promisify } = require('util');

// Parse JavaScript parameters into something ethjs can use
function parseZapParameters(params) {
    const output = [];

    for ( let i = 0; i < params.length; i++ ) {
        const param = params[i];

        if ( typeof param == 'string' ) {
            if ( param.startsWith('0x') ) {
                // Already in hex
                output.push(param);
            }
            else {
                // Handle strings
                output.push(Eth.fromAscii(param));
            }

        }
        else if ( typeof param == 'number' ) {
            // Parse numbers to big nums
            output.push(Eth.toBN(param));
        }
        else if ( typeof param == 'object' ) {
            if ( param.constructor.name == 'BN' ) {
                // Bignums are fine
                output.push(param);
            }
            else {
                return new Error("Unable to handle parameter of type " + param.constructor.name);
            }
        }
        else {
            return new Error("Unable to handle parameter of type " + typeof param);
        }
    }

    return output;
}

class ZapArbiter {
    constructor({eth, contract_address, abiFile}) {
        this.eth = eth;
        this.address = contract_address;
        this.abiFile = abiFile;
        this.contract = eth.contract(abiFile).at(this.address);
    }

    // Initiate a subscription
    async initiateSubscription({oracleAddress, endpoint, js_params, dots, publicKey, from, gas}) {
        try {
            const params = parseZapParameters(js_params);
            // Make sure we could parse it correctly
            if ( params instanceof Error ) {
                throw params;
            }
    
            return await this.contract.initiateSubscription(
                oracleAddress,
                params,
                endpoint,
                publicKey,
                dots,
                { from: from, gas: gas }
            );
        } catch(err) {
            throw err;
        }
    }

    // Listen for initiate events
    async listen() {
        try {
            const accounts = await this.eth.accounts();
            // const zapDataPurchaseAsyncNew = promisify(this.contract.ZapDataPurchase().new)
            if ( accounts.length == 0 ) {
                throw new Error("No accounts loaded");
            }

            const account = accounts[0];
            // Create the Event filter
            this.filter = this.contract.filters();
            // this.contract.filters.filter.allEvents({ fromBlock: 0, toBlock: 'latest' });
            // this.filter = await this.contract.allEvents({ fromBlock: 0, toBlock: 'latest' });
            console.log(this.filter);
            // Watch the event filter
            const result = await this.filter.watch((err, res) => {
                return new Promise((resolve, reject) => {
                    if (err) return reject(err);
                    if (res) return resolve(res);
                });
            });
            console.log(result);
            // Sanity check
            if ( result.length != 6 ) {
                throw new Error("Received invalid ZapDataPurchase event");
            }

            // Make sure it is us
            if ( result[0] != account || result[1] != account ) {
                return;
            }

            // Get the block number
            const blockNumber = await this.eth.blockNumber();
            // Emit event
            return {
                provider: result[0],
                subscriber: result[1],
                public_key: result[2],
                endblock: result[3] + blockNumber.toNumber(),
                endpoint_params: result[4],
                endpoint: result[5]
            };
        } catch(err) {
            console.log(err);
            throw err;
        }
    }

    // Close the connection
    close() {
        if ( this.filter ) {
            this.filter.stopWatching();
            delete this.filter;
        }
    }
}

module.exports = ZapArbiter;
