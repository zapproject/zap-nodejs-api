const ZapCurve = require('./ZapCurve');

class ZapOracle {
    constructor(registry) {
        this.registry = registry;

        // Empty default
        this.address = "";
        this.public_key = "";
        this.registry_keys = [];
    }

    // Get the curve information for a given endpoint from this Oracle
    getCurve(endpoint, callback) {
        const contract = this.registry.contract;

        contract.getProviderCurve(this.address, endpoint).then((curveType, curveStart, curveMultiplier) => {
            callback(null, new ZapCurve(
                curveType,
                curveStart,
                curveMultiplier
            ));
        }).catch((err) => {
            callback(err);
        });
    }

    getZapBound(endpoint, callback) {
        const contract = this.registry.contract;

        contract.getZapBound(this.address, endpoint).then((totalBound) => {
            callback(null, totalBound);
        }).catch((err) => {
            callback(err);
        });
    }
}

module.exports = ZapOracle;
