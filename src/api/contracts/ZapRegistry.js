const ZapOracle = require('../ZapOracle');
const fs = require('fs');

class ZapRegistry {
    constructor(eth, network) {
        this.eth = eth;

        // Load the Registry ABI
        const registry_file = fs.readFileSync("../contracts/abis/ZapRegistry.json");
        const abi = JSON.parse(registry_file);

        // Load the Registry address
        const addresses = fs.readFileSync("../contracts/" + network + "/address.json");

        this.address = JSON.parse(addresses)['Registry'];
        this.contract = eth.contract(abi).at(this.address);
    }

    // Get oracle by address
    getOracle(address, callback) {
        const oracle = new ZapOracle(this);
        oracle.address = address;

        // Get the provider's public getRouteKeys
        this.contract.getProviderPublicKey(address).then((public_key) => {
            oracle.public_key = public_key;

            // Get the route keys next
            return this.contract.getRouteKeys();
        }).then((route_keys) => {
            oracle.route_keys = route_keys;

            // Output loaded object
            callback(null, oracle);
        }).catch((err) => {
            callback(err);
        });
    }
}

module.exports = ZapRegistry;
