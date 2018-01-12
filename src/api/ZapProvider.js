const Eth = require('ethjs');
const fs = require('fs');

class ZapProvider {
    constructor(eth, network) {
        this.eth = eth;

        const arbitrator_file = fs.readFileSync("../contracts/abis/Arbitrator.json");
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

            this.filter = this.contract.ZapDataPurchase().new((err, res) => {
                callback(err);
            });

            this.filter.watch().then((result) => {
                if ( result[0] != account ) {
                    return;
                }

                
            }).catch((err) => {
                callback(err);
            });
        });
    }

    close() {
        if ( this.filter ) {
            this.filter.stopWatching();
            delete this.filter;
        }
    }
}
