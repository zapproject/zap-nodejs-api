const Base = require('./Base');

class ZapArbiter {
    // Initiate a subscription
    async initiateSubscription({oracleAddress, endpoint, js_params, dots, publicKey, from, gas}) {
        try {
            const contractInstance = await this.contractInstance();
            // Make sure we could parse it correctly
            if (params instanceof Error) {
                throw params;
            }

            return await contractInstance.initiateSubscription(
                oracleAddress,
                endpoint,
                js_params,
                publicKey,
                dots,
                {from: from, gas: gas}
            );
        } catch (err) {
            throw err;
        }
    }
}

module.exports = ZapArbiter;
