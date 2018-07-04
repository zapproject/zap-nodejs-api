const contract = require('truffle-contract');
const { fixTruffleContractCompatibilityIssue } = require('../utils');
const assert = require('assert');
const Web3 = require('web3');
const config = require('./../../../config/index');
const Artifacts = require('./../Artifacts');

class Base {

  static getConfig(){ return config; }

  constructor({contractName, _artifactsModule, _networkId, _provider}) {
    try {
      this.artifactsModule = _artifactsModule || Artifacts;
      let artifact = this.artifactsModule[contractName];
      assert(artifact, `No artifact for contract ${contractName} found`);
      this.provider = _provider ||
            new Web3.providers.WebsocketProvider('ws://127.0.0.1:8545');
      // network id default to mainnet
      this.networkId = _networkId || 1;
      if (this.networkId === 1) {
        assert(artifact.abi, 'invalid artifact');
        assert(artifact.networks[this.networkId], 'contract for current network is not available');
        assert(artifact.networks[this.networkId].address, 'address for current network is not found');
      }
      this.DEFAULT_GAS = 400000;
      this.web3 = new Web3(this.provider);
      this.contract = new this.web3.eth.Contract(artifact.abi, artifact.networks[this.networkId].address);

    } catch (err) {
      throw err;
    }
  }
}

module.exports = Base;
