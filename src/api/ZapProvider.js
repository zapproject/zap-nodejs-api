const EventEmitter = require('events');
const fs = require('fs');

class ZapProvider extends EventEmitter {
    constructor(eth, network) {
        super();
        this.eth = eth;

        const arbitrator_file = fs.readFileSync("../contracts/abis/ZapArbiter.json");
        const abi = JSON.parse(arbitrator_file);

        // Load the Registry address
        const addresses = fs.readFileSync("../contracts/" + network + "/address.json");

        this.address = JSON.parse(addresses)['Arbitrator'];
        this.contract = eth.contract(abi).at(this.address);
    }

    listen(callback) {
        this.eth.accounts().then((accounts) => {
            if ( accounts.length == 0 ) {
                callback(new Error("No accounts loaded"));
                return;
            }

            const account = accounts[0];

            // Create the Event filter
            this.filter = this.contract.ZapDataPurchase().new((err, res) => {
                callback(err);
            });

            // Watch the event filter
            this.filter.watch().then((result) => {
                // Sanity check
                if ( result.length != 6 ) {
                    callback(new Error("Received invalid ZapDataPurchase event"));
                    return;
                }

                // Make sure it is us
                if ( result[0] != account ) {
                    return;
                }

                // Emit event
                this.emit("new_subscription", {
                    subscriber: result[1],
                    public_key: result[2],
                    amount: result[3],
                    endpoint_params: result[4],
                    enpoint: result[5]
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

module.exports = ZapProvider;
