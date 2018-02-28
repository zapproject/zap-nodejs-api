// @flow
require('babel-register');
require('babel-polyfill');
const ZapOracle = require('../ZapOracle');
const {
    getHexString,
    getHexBuffer,
    toHex
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
    // uint256 public_key,
    //     string title,
    //     bytes32 endpoint_specifier,
    //     bytes32[] endpoint_params
    async initiateProvider({public_key, title, endpoint_specifier, endpoint_params, from}) {
        try {
            endpoint_specifier = getHexString(endpoint_specifier);
            console.log('-----------------------------------------')
            console.log(public_key, title, endpoint_specifier, endpoint_params, from)
            console.log('-----------------------------------------')
            return await this.contract.initiateProvider(
                public_key, 
                title, 
                endpoint_specifier,
                endpoint_params,
                { from }
            );
        } catch(err) {
            throw err;
        }
    }

    // bytes32 specifier,
    //     LibInterface.ZapCurveType curveType,
    //     uint256 curveStart,
    //     uint256 curveMultiplier

    async initiateProviderCurve({ specifier, ZapCurveType, curveStart, curveMultiplier, from }) {
        try {
            const curve = curveType[ZapCurveType];
            specifier = getHexString(specifier);
            console.log('------------------------------------')
            console.log(specifier, curve, curveStart, curveMultiplier, from)
            console.log('------------------------------------')
            return await this.contract.initiateProviderCurve(
                specifier,
                curve,
                curveStart,
                curveMultiplier,
                { from }
            );
        } catch(err) {
            throw err;
        }
    }

    // bytes32 specifier, bytes32[] endpoint_params

    async setEndpointParams({ specifier, params, from }) {
        try {
            specifier = getHexString(specifier);
            let endpoint_params = [];
            params.forEach(el => endpoint_params.push(getHexString(el)));
            console.log('-----------------------------------')
            console.log(typeof specifier, specifier, endpoint_params, from)
            console.log('-----------------------------------')
            return await this.contract.setEndpointParams(
                specifier,
                endpoint_params,
                { from }
            );
        } catch(err) {
            throw err;
        }
    }

    // get oracle by address
    async getOracle({ address }) {
        try {
            const oracle = new ZapOracle(this);
            oracle.address = address;

            // Get the provider's public getRouteKeys
            const public_key = await this.contract.getProviderPublicKey( address );
            oracle.public_key = public_key;
    
            // // Get the route keys next
            // const route_keys = await this.contract.getRouteKeys( address, { from });
            // oracle.route_keys = route_keys;
    
            // // Output loaded object
            return oracle;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = ZapRegistry;
