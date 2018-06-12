const Base = require('./Base');

class Arbiter extends Base {
    // Initiate a subscription
    async initiateSubscription({oracleAddress, endpoint, js_params, dots, publicKey, from, gas}) {
        try {
            const contractInstance = await this.contractInstance();
            // Make sure we could parse it correctly
            if (js_params instanceof Error) {
                throw js_params;
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

module.exports = Arbiter;
