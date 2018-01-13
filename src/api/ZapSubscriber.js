const EventEmitter = require('events');
const fs = require('fs');
const ZapRegistry = require('./ZapRegistry');

class ZapSubscriber extends EventEmitter {
    constructor(eth, network) {
        super();
        this.eth = eth;
        this.registry = new ZapRegistry(eth, network);

        const arbitrator_file = fs.readFileSync("../contracts/abis/ZapArbiter.json");
        const abi = JSON.parse(arbitrator_file);

        // Load the Registry address
        const addresses = fs.readFileSync("../contracts/" + network + "/address.json");

        this.address = JSON.parse(addresses)['Arbitrator'];
        this.contract = eth.contract(abi).at(this.address);
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
}

module.exports = ZapSubscriber;
