require('babel-register');
require('babel-polyfill');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const ZapOracle = require('../ZapOracle');

class ZapRegistry {
    constructor({ eth, abiPath, contract_address}) {
        this.eth = eth;
        this.address = contract_address;
        this.contract = '';
        this.abiPath = abiPath;
    }

    async initiateProvider() {
        try {
            const abiBufferFile = await readFile(this.abiPath);
            const abiFile = JSON.parse(abiBufferFile);
            this.contract = this.eth.contract(abiFile).at(this.address);
            return {success: true};
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
module.exports.abiPath = '';
module.exports.contractPath = '';
