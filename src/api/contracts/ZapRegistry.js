require('babel-register');
require('babel-polyfill');
const ZapOracle = require('../ZapOracle');

class ZapRegistry {
    constructor(eth) {
        this.eth = eth;

        // // Load the Registry ABI
        // const registry_file = fs.readFileSync("../../contracts/abis/ZapRegistry.json");
        // const abi = JSON.parse(registry_file);

        // // Load the Registry address
        // const addresses = fs.readFileSync("../../contracts/" + network + "/address.json");

        // this.address = JSON.parse(addresses)['Registry'];
        // this.contract = eth.contract(abi).at(this.address);
        this.address = '';
        this.contract = '';
    }

    initiateProvider({address, contract}) {
        this.address = address;
        this.contract = contract;
    }

    // get oracle by address
    async getOracle(address, callback) {
        try {
            const oracle = new ZapOracle(this);
            oracle.address = address;

            // Get the provider's public getRouteKeys
            const public_key = await this.contract.getProviderPublicKey(address)
            oracle.public_key = public_key;
    
            // Get the route keys next
            const route_keys = await this.contract.getRouteKeys();
            oracle.route_keys = route_keys;
    
            // Output loaded object
            callback(null, oracle);
        } catch (err) {
            callback(err);
        }
    }
}

module.exports = ZapRegistry;
