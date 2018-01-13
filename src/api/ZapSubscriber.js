const Eth = require('ethjs');
const EventEmitter = require('events');
const fs = require('fs');
const ZapRegistry = require('./ZapRegistry');

class ZapSubscriber extends EventEmitter {
    constructor(wallet) {
        super();
        this.wallet = wallet;
        this.eth = wallet.eth;
        this.registry = new ZapRegistry(this.eth, wallet.network);

        const arbitrator_file = fs.readFileSync("../contracts/abis/ZapArbiter.json");
        const abi = JSON.parse(arbitrator_file);

        // Load the Registry address
        const addresses = fs.readFileSync("../contracts/" + wallet.network + "/address.json");

        this.address = JSON.parse(addresses)['Arbitrator'];
        this.contract = this.eth.contract(abi).at(this.address);
    }

    // Get the amount of zap necessary for a given amount of dots
    getZapRequired(oracle, endpoint, dots, callback) {
        oracle.getCurve(endpoint, (err, curve) => {
            if ( err ) {
                callback(err);
                return;
            }

            oracle.getZapBound(endpoint, (err, totalBound) => {
                if ( err ) {
                    callback(err);
                    return;
                }

                let currentDots = 0;            // Current amount of dots
                let currentBound = totalBound;  // Current total bound
                let amountNeeded = 0;           // How much zap we need

                while ( currentDots < dots ) {
                    // Get the price of zap
                    let price = curve.getPrice(currentBound);

                    // Bond that zap
                    currentBound += price;
                    amountNeeded += price;

                    currentDots++;
                }

                callback(null, amountNeeded);
            });
        });
    }

    subscribe(oracle, endpoint, params, dots, callback) {
        if ( endpoint != "smartcontract" ) {
            // Parse the parameters
            for ( let i = 0; i < params.length; i++ ) {
                const param = params[i];

                if ( typeof param == 'string' ) {
                    // Already in hex
                    if ( param.startsWith('0x') ) {
                        continue;
                    }

                    // Handle strings
                    params[i] = Eth.fromAscii(param);
                }
                else if ( typeof param == 'number' ) {
                    // Parse numbers to big nums
                    params[i] = Eth.toBN(param);
                }
                else if ( typeof param == 'object' ) {
                    if ( param.constructor.name == 'BN' ) {
                        // Bignums are fine
                        continue;
                    }
                    else {
                        callback(new Error("Unable to handle parameter of type " + param.constructor.name));
                        return;
                    }
                }
                else {
                    callback(new Error("Unable to handle parameter of type " + typeof param));
                    return;
                }
            }

            // Do a temporal endpoint
            // Get the amount of zap needed for given amount of dots
            this.getZapRequired(oracle, endpoint, dots, (err, amount) => {
                if ( err ) {
                    callback(err);
                    return;
                }

                // Get the current Zap balance
                this.wallet.getBalance((err, balance) => {
                    if ( err ) {
                        callback(err);
                        return;
                    }

                    // Make sure that there is Zap balance for this
                    if ( balance < amount ) {
                        callback(new Error("Insufficient balance"));
                        return;
                    }

                    // Bond the necessary amount of zap for the given dots
                    this.wallet.bond(oracle, endpoint, amount, (err, numZap, numDots) => {
                        if ( err ) {
                            callback(err);
                            return;
                        }

                        // Make sure we succesfully got these dots
                        if ( numDots != dots ) {
                            callback(new Error("Failed to get right amount of dots"));
                            // TODO - unbond these dots or try to bond for more
                            return;
                        }

                        this.contract.initiateSubscription(
                            this.oracle.address,
                            params,
                            endpoint,
                            0 /* TODO: actual public key */,
                            dots
                        ).then(() => {
                            callback(null);
                            // TODO: start listening for the event
                        });
                    });
                });
            });
        }
    }
}

module.exports = ZapSubscriber;
