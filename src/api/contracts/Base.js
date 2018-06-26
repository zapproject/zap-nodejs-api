const contract = require("truffle-contract");
const { fixTruffleContractCompatibilityIssue } = require("../utils");
const assert = require("assert");
const Web3 = require("web3");
const config = require('./../../../config/index');
class Base {

    static getConfig(){return config}

    constructor(artifact) {
        try {
            let env = process.env.NODE_ENV;
            if(!env || !Object.keys(config.networks).includes(env.toLowerCase())) env = "prod";
            let currentNetwork = config.networks[env.toLowerCase()];
            if(env === "prod"){
                assert(artifact.abi,"invalid artifact");
                assert(artifact.networks[currentNetwork.id],"contract for current network is not available");
                assert(artifact.networks[currentNetwork.id].address,"address for current network is not found");
            }
            assert(currentNetwork.provider,"provider for current network is not found");


            this.DEFAULT_GAS = 400000;
            this.web3 = new Web3(currentNetwork.provider);
            this.contract = new this.web3.eth.Contract(artifact.abi,artifact.networks[currentNetwork.id].address)

        } catch (err) {
            throw err;
        }
    }
}

module.exports = Base;
