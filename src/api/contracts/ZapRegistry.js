// @flow
require('babel-register');
require('babel-polyfill');
const ZapOracle = require('../ZapOracle');
const { fromAscii } = require('ethjs');

const curveType = {
    "ZapCurveNone": 0,
    "ZapCurveLinear": 1,
    "ZapCurveExponential": 2,
    "ZapCurveLogarithmic": 3
};


class ZapRegistry {
    constructor({eth, contract_address, abiFile}) {
        this.eth = eth;
        this.address = contract_address;
        this.abiFile = abiFile;
        this.contract = eth.contract(abiFile).at(this.address);
        this.getOracle = this.getOracle.bind(this);
    }

    async initiateProvider({public_key, title, endpoint_specifier, endpoint_params, from, gas}) {
        try {
            return await this.contract.initiateProvider(
                public_key, 
                fromAscii(title), 
                fromAscii(endpoint_specifier),
                endpoint_params,
                {
                    'from': from,
                    'gas': gas
                }
            );
        } catch(err) {
            throw err;
        }
    }

    async initiateProviderCurve({ specifier, ZapCurveType, curveStart, curveMultiplier, from, gas }) {
        try {
            const curve = curveType[ZapCurveType];
            return await this.contract.initiateProviderCurve(
                fromAscii(specifier),
                curve,
                curveStart,
                curveMultiplier,
                {
                    'from': from,
                    'gas': gas
                }
            );
        } catch(err) {
            throw err;
        }
    }

    // bytes32 specifier, bytes32[] endpoint_params

    async setEndpointParams({ specifier, params, from, gas }) {
        try {
            let endpoint_params = [];
            params.forEach(el => endpoint_params.push(fromAscii(el)));
            return await this.contract.setEndpointParams(
                fromAscii(specifier),
                endpoint_params,
                {
                    'from': from,
                    'gas': gas
                }
            );
        } catch(err) {
            throw err;
        }
    }

    // get oracle by address
    async getOracle({ address, specifier }) {
        try {
            const oracle = new ZapOracle(this);
            oracle.address = address;

            // Get the provider's public getRouteKeys
            const public_key = await this.contract.getProviderPublicKey( address );
            oracle.public_key = public_key;
    
            // // Get the route keys next
            // getNextEndpointParam address provider, bytes32 specifier, uint256 index
            let i = 0;
            let endpoint_params = [];
            while(true) {
                try {
                    if (i >= 50) break;
                    const { nextIndex, endpoint_param } = await this.contract.getNextEndpointParam(
                        address,
                        fromAscii(specifier),
                        i
                    )
                    endpoint_params.push(endpoint_param)
                    if(!nextIndex.toNumber()) break;
                    i++
                } catch(err) {
                    console.log(err)
                    break;
                }
            }
            oracle.endpoint_params = endpoint_params;
            // // Output loaded object
            return oracle;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = ZapRegistry;
