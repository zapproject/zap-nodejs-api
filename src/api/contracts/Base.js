const contract = require("truffle-contract");
const { fixTruffleContractCompatibilityIssue } = require("../utils");

class Base {
    constructor({provider, address, artifact}) {
        try {
            this.address = address;
            this.contract = contract(
                artifact
            );
            this.contract.setProvider(provider);
            this.contract = fixTruffleContractCompatibilityIssue(this.contract);
        } catch (err) {
            throw err;
        }
    }

    // Get deployed contract instance
    async contractInstance() {
        return await this.contract.at(this.address);
    }
}

module.exports = Base;