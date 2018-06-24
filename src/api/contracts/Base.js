const contract = require("truffle-contract");
const { fixTruffleContractCompatibilityIssue } = require("../utils");
const config = require('./../../../config/index');
class Base {
    constructor({artifact}) {
        try {
            this.contract = contract(
                artifact.abi,
                artifact[config.network]._address
            );
            this.contract.setProvider(config.provider);
            this.contract = fixTruffleContractCompatibilityIssue(this.contract);
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Base;