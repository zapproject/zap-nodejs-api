const contract = require("truffle-contract");
const { fixTruffleContractCompatibilityIssue } = require("../utils");
const config = require('./../../../config/index');
class Base {

    static getConfig(){return config}

    constructor(artifact) {
        try {
            this.contract = contract(
                artifact.abi,
                artifact[config.currentNetwork]._address
            );
            this.contract.setProvider(config.currentProvider);
            this.contract = fixTruffleContractCompatibilityIssue(this.contract);
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Base;