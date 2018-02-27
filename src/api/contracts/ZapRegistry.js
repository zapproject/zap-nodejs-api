// @flow
require('babel-register');
require('babel-polyfill');
const ZapOracle = require('../ZapOracle');
const {
    getHexBuffer,
} = require('../utils');

const curveType = {
    "ZapCurveNone": 0,
    "ZapCurveLinear": 1,
    "ZapCurveExponential": 2,
    "ZapCurveLogarithmic": 3
};



class ZapRegistry {
    constructor({eth, address, abiFile}) {
        this.eth = eth;
        this.address = address;
        this.abiFile = abiFile;
        this.contract = eth.contract(abiFile).at(address);
        this.getOracle = this.getOracle.bind(this);
    }


    // for example initiate Provider should get (43254352345, "spaceoracle", 'none', [ ]) in arguments
    async initiateProvider({public_key, title, endpoint_specifier, endpoint_params, from}) {
        try {
            const specifier = getHexBuffer(endpoint_specifier);
            return await this.contract.initiateProvider(
                public_key, 
                title, 
                specifier,
                endpoint_params,
                { from }
            );
        } catch(err) {
            throw err;
        }
    }

    async initiateProviderCurve({ specifier, ZapCurveType, curveStart, curveMultiplier, from }) {
        try {
            const curve = curveType[ZapCurveType];
            const bufferSpecifier = getHexBuffer(specifier);
            return await this.contract.initiateProviderCurve(
                bufferSpecifier,
                curve,
                curveStart,
                curveMultiplier,
                { from }
            );
        } catch(err) {
            throw err;
        }
    }

    async setEndpointParams({ specifier, endpoint_params, from }) {
        try {
            specifier = getHexBuffer(specifier);
            let params = [];
            endpoint_params.forEach(el => params.push(getHexBuffer(el)));
            return await this.contract.setEndpointParams(
                specifier,
                params,
                { from }
            );
        } catch(err) {
            throw err;
        }
    }

    // get oracle by address
    async getOracle({ address, from }) {
        try {
            const oracle = new ZapOracle(this);
            oracle.address = address;

            // Get the provider's public getRouteKeys
            const public_key = await this.contract.getProviderPublicKey( address, { from });
            oracle.public_key = public_key;
    
            // Get the route keys next
            const route_keys = await this.contract.getRouteKeys( address, { from });
            oracle.route_keys = route_keys;
    
            // Output loaded object
            return oracle;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = ZapRegistry;
