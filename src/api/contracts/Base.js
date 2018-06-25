const contract = require("truffle-contract");
const { fixTruffleContractCompatibilityIssue } = require("../utils");
const assert = require("assert");
const config = require('./../../../config/index');
class Base {

    static getConfig(){return config}

    constructor(artifact) {
        try {
            let currentNetwork = config.ganacheNetwork;
            console.log(process.env.NODE_ENV);
            if(!process.env.NODE_ENV || process.env.NODE_ENV.toLowerCase() ==="prod"){
                currentNetwork = config.mainNetwork
            }
            assert(artifact.abi,"invalid artifact");
            assert(artifact.networks[currentNetwork.id],"contract for current network is not available");
            assert(artifact.networks[currentNetwork.id].address,"address for current network is not found");
            assert(currentNetwork.provider,"provider for current network is not found");
            this.contract = contract(
                artifact.abi,
                artifact.networks[currentNetwork.id].address
            );
            this.contract.setProvider(currentNetwork.provider);
            this.contract = fixTruffleContractCompatibilityIssue(this.contract);
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Base;
