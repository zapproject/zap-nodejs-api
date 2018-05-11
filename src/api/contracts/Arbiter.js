
// Parse JavaScript parameters into something ethjs can use
function parseZapParameters(web3, params) {
    const output = [];

    for (let i = 0; i < params.length; i++) {
        const param = params[i];

        if (typeof param == 'string') {
            if (param.startsWith('0x')) {
                // Already in hex
                output.push(param);
            }
            else {
                // Handle strings
                output.push(web3.utils.utf8ToHex(param));
            }

        }
        else if (typeof param == 'number') {
            // Parse numbers to big nums
            output.push(new web3.utils.BN(param));
        }
        else if (typeof param == 'object') {
            if (param.constructor.name == 'BN') {
                // Bignums are fine
                output.push(param);
            }
            else {
                return new Error("Unable to handle parameter of type " + param.constructor.name);
            }
        }
        else {
            return new Error("Unable to handle parameter of type " + typeof param);
        }
    }

    return output;
}

class ZapArbiter {
    constructor({ web3, contract_address, abi }) {
        this.web3 = web3;
        this.address = contract_address;
        this.abi = abi;
        this.contract = new this.web3.eth.Contract(this.abi, this.address);

        this.isZapArbiter = true;
    }

    // Initiate a subscription
    async initiateSubscription({ oracleAddress, endpoint, js_params, dots, publicKey, from, gas }) {
        try {
            const params = parseZapParameters(this.web3, js_params);
            // Make sure we could parse it correctly
            if (params instanceof Error) {
                throw params;
            }

            return await this.contract.methods.initiateSubscription(
                oracleAddress,
                endpoint,
                params,
                publicKey,
                dots,
                ).send({ from: from, gas: gas }
            );
        } catch (err) {
            throw err;
        }
    }
}

module.exports = ZapArbiter;
