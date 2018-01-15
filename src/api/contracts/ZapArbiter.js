const Eth = require('ethjs');
const fs = require('fs');

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
    constructor(eth, network) {
        this.eth = eth;

        const arbitrator_file = fs.readFileSync("../../contracts/abis/ZapArbiter.json");
        const abi = JSON.parse(arbitrator_file);

        // Load the Registry address
        const addresses = fs.readFileSync("../../contracts/" + network + "/address.json");

        this.address = JSON.parse(addresses)['Arbitrator'];
        this.contract = eth.contract(abi).at(this.address);
    }

    // Initiate a subscription
    initiateSubscription(oracle, endpoint, js_params, dots, callback) {
        const params = parseZapParameters(js_params);

        // Make sure we could parse it correctly
        if ( params instanceof Error ) {
            callback(params);
            return;
        }

        this.contract.initiateSubscription(
            oracle.address,
            params,
            endpoint,
            0 /* TODO: actual public key */,
            dots
        ).then(() => {
            callback(null);
        }).catch(err => {
            callback(err);
        });
    }

    // Listen for initiate events
    listen(callback) {
        this.eth.accounts().then((accounts) => {
            if ( accounts.length == 0 ) {
                callback(new Error("No accounts loaded"));
                return;
            }

            const account = accounts[0];

            // Create the Event filter
            this.filter = this.contract.ZapDataPurchase().new((err, res) => {
                if ( err ) {
                    callback(err);
                }
            });

            // Watch the event filter
            this.filter.watch().then((result) => {
                // Sanity check
                if ( result.length != 6 ) {
                    callback(new Error("Received invalid ZapDataPurchase event"));
                    return;
                }

                // Make sure it is us
                if ( result[0] != account || result[1] != account ) {
                    return;
                }

                // Get the block number
                this.eth.blockNumber().then((blockNumber) => {
                    // Emit event
                    callback(null, {
                        provider: result[0],
                        subscriber: result[1],
                        public_key: result[2],
                        endblock: result[3] + blockNumber.toNumber(),
                        endpoint_params: result[4],
                        endpoint: result[5]
                    });
                }).catch(err => {
                    callback(err);
                });
            }).catch((err) => {
                callback(err);
            });
        });
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
