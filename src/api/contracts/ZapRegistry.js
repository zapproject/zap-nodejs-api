require('babel-register');
require('babel-polyfill');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const ZapOracle = require('../ZapOracle');

class ZapRegistry {
    constructor({ eth, contract_address}) {
        this.eth = eth;
        this.address = contract_address;
        this.contract = '';
    }

    initiateProvider(abiFile) {
        this.contract = this.eth.contract(abiFile).at(this.address);
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
