// @flow
require('babel-register');
require('babel-polyfill');
const ZapOracle = require('../ZapOracle');

const curveType = {
    "ZapCurveNone": 0,
    "ZapCurveLinear": 1,
    "ZapCurveExponential": 2,
    "ZapCurveLogarithmic": 3
};

class ZapRegistry {
    constructor(eth) {
        this.eth = eth;
        this.address = '';
        this.contract = '';
    }

    initiateProvider({address, contract}) {
        this.address = address;
        this.contract = contract;
    }

    async initiateProviderCurve({ specifier, ZapCurveType, curveStart, curveMultiplier }) {
        const curve = curveType[ZapCurveType];
        return await this.contract.initiateProviderCurve(
            specifier,
            curve,
            curveStart,
            curveMultiplier
        );
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
