require('babel-register');
require('babel-polyfill');
const ZapOracle = require('../ZapOracle');

class ZapRegistry {
    constructor({eth, address, abiFile}) {
        this.eth = eth;
        this.address = address;
        this.abiFile = abiFile;
        this.contract = eth.contract(abiFile).at(address);
    }

    async initiateProvider({ route_keys, public_key, title, from  }) {
        try {
            return await this.contract.initiateProvider(
                route_keys,
                public_key,
                title,
                { from }
            );
        } catch(err) {
            throw err;
        }
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
