const Oracle = require('../components/Oracle');
const Base = require('./Base');

const curveType = {
    "ZapCurveNone": 0,
    "ZapCurveLinear": 1,
    "ZapCurveExponential": 2,
    "ZapCurveLogarithmic": 3
};

class ZapRegistry extends Base {
    constructor({provider, address, artifact}) {
        super({provider: provider, address: address, artifact: artifact});
        this.getOracle = this.getOracle.bind(this);
    }

    async initiateProvider({public_key, title, endpoint_specifier, endpoint_params, from, gas}) {
        try {
            const contractInstance = await this.contractInstance();
            return await contractInstance.initiateProvider(
                public_key,
                title,
                endpoint_specifier,
                endpoint_params,
                {
                    from: from,
                    gas: gas
                }
            );
        } catch (err) {
            throw err;
        }
    }

    async initiateProviderCurve({specifier, ZapCurveType, curveStart, curveMultiplier, from, gas}) {
        try {
            const curve = curveType[ZapCurveType];
            const contractInstance = await this.contractInstance();
            return await contractInstance.initiateProviderCurve(
                specifier,
                curve,
                curveStart,
                curveMultiplier,
                {
                    'from': from,
                    'gas': gas
                }
            );
        } catch (err) {
            throw err;
        }
    }

    // bytes32 specifier, bytes32[] endpoint_params
    async setEndpointParams({specifier, params, from, gas}) {
        try {
            const contractInstance = await this.contractInstance();
            let endpoint_params = [];
            params.forEach(el => endpoint_params.push(fromAscii(el)));
            return await contractInstance.setEndpointParams(
                specifier,
                endpoint_params,
                {
                    'from': from,
                    'gas': gas
                }
            );
        } catch (err) {
            throw err;
        }
    }

    // get oracle by address
    async getOracle({address, specifier}) {
        try {
            const contractInstance = await this.contractInstance();
            const oracle = new Oracle(this);
            oracle.address = address;

            // Get the provider's public getRouteKeys
            oracle.public_key = await contractInstance.getProviderPublicKey(address);

            // // Get the route keys next
            // getNextEndpointParam address provider, bytes32 specifier, uint256 index
            let i = 0;
            let endpoint_params = [];
            while (true) {
                try {
                    if (i >= 50) break;
                    const {nextIndex, endpoint_param} = await contractInstance.getNextEndpointParam(
                        address,
                        specifier,
                        i
                    );
                    endpoint_params.push(endpoint_param);
                    if (!nextIndex.toNumber()) break;
                    i++
                } catch (err) {
                    console.log(err);
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
