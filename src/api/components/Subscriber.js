const EventEmitter = require('events');
const Arbiter = require('./../contracts/Arbiter');
const Registry = require('./../contracts/Registry');
const Bondage = require("./../contracts/Bondage")
const Dispatch = require("./../contracts/Dispatch")

class Subscriber extends EventEmitter {

    constructor(eth, wallet, keypair, registryAddress, arbiterAddress) {
        super();

        this.handlers = {};
        this.wallet = wallet;
        this.keypair = keypair;
        this.eth = wallet.eth;

        this.registry = new Registry(this.eth, wallet.network, registryAddress);
        this.arbiter = new Arbiter(this.eth, wallet.network, arbiterAddress);
    }

    // Add a endpoint handler
    addHandler(type, handler) {
        this.handlers[type] = handler;
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

    subscribe(oracle, endpoint, dots, callback) {
        if ( endpoint != "smartcontract" ) {
            if ( !this.handlers[endpoint] ) {
                callback(new Error("Unable to find a handler for endpoint " + endpoint));
                return;
            }

            // Generate parameters for this handler
            const js_params = this.handlers[endpoint].initiateSubscription(oracle);

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
                            oracle.address,             // Oracle's address
                            js_params,                  // Unencoded parameters
                            endpoint,                   // Which endpoint to use
                            this.keypair.getPublic(),   // Our public key
                            dots,                       // Amount of dots we're using
                            () => {
                                this.pendingSubscriptions[oracle.address] = callback;
                            }
                        );
                    });
                });
            });
        }
    }

    // Listen for events from the Arbiter class.
    listen() {
        // Listen for events
        this.arbiter.listen((err, event) => {
            // See if we have any subscriptions pending on this event
            const callback = this.pendingSubscriptions[event.provider];

            if ( callback ) {
                this.pendingSubscriptions[event.provider] = null;
                this.pendingSubscriptions[event.provider](err, event);
            }
        });
    }
}

module.exports = Subscriber;
