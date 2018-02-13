require('babel-register');
require('babel-polyfill');
const ZapOracle = require('../ZapOracle');

class ZapRegistry {
    constructor({ eth, contract_address, abiFile}) {
        this.eth = eth;
        this.address = contract_address;
        this.contract = '';
        this.abiFile = abiFile;
    }

    initiateProvider() {
        this.contract = this.eth.contract(this.abiFile).at(this.address);
    }

    // get oracle by address
    async getOracle(address, callback) {
        try {
            const oracle = new ZapOracle(this);
            oracle.address = address;

            // Get the provider's public getRouteKeys
            const public_key = await this.contract.getProviderPublicKey(address);
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
