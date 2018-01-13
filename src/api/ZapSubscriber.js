const EventEmitter = require('events');
const ZapArbiter = require('./contracts/ZapArbiter');
const ZapRegistry = require('./contracts/ZapRegistry');

class ZapSubscriber extends EventEmitter {
    constructor(wallet) {
        super();
        this.wallet = wallet;
        this.eth = wallet.eth;

        this.registry = new ZapRegistry(this.eth, wallet.network);
        this.arbiter = new ZapArbiter(this.eth, wallet.network);
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

    subscribe(oracle, endpoint, js_params, dots, callback) {
        if ( endpoint != "smartcontract" ) {
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

                        this.arbiter.initiateSubscription(
                            oracle.address,
                            js_params,
                            endpoint,
                            0 /* TODO: actual public key */,
                            dots,
                            () => {
                                callback(null);
                            }
                        );
                    });
                });
            });
        }
    }
}

module.exports = ZapSubscriber;
