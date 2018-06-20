const { readFileSync } = require('fs');
const Config = require('../../config/index');

const toHex = (str) => {
    let hex = '';
    for(let i=0;i<str.length;i++) {
        hex += ''+str.charCodeAt(i).toString(16);
    }
    return `0x${hex}`;
};

const getHexBuffer = (specifier) => new Buffer(specifier, 'hex');

const getHexString = (str) => {
    const data = new Buffer(str);
    console.log(data.byteLength)
    const hex = data.toString('hex');
    return `0x${hex}`;
};

const fixTruffleContractCompatibilityIssue = (contract) => {
    if (!contract.currentProvider.sendAsync || typeof contract.currentProvider.sendAsync !== "function") {
        contract.currentProvider.sendAsync = function() {
            return contract.currentProvider.send.apply(
                contract.currentProvider, arguments
            );
        };
    }
    return contract;
};

class Loader {
    constructor({ address, id }) {
        this.currentNetwork = { address, id };
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(this.currentNetwork.address));
    }

    getArbiterInstance(network_id = this.currentNetwork.id) {
        const artifact = JSON.parse(fs.readFileSync(path.join(ProjectPath, Config.arbiterAbi)));
        const address = artifact.networks[network_id].address;
        const provider = this.web3.currentProvider;

        return new Arbiter({ provider, address, artifact });
    }

    getBondageInstance(network_id = this.currentNetwork.id) {
        const artifact = JSON.parse(fs.readFileSync(path.join(ProjectPath, Config.bondageAbi)));
        const address = artifact.networks[network_id].address;
        const provider = this.web3.currentProvider;

        return new Bondage({ provider, address, artifact });
    }

    getDispatchInstance(network_id = this.currentNetwork.id) {
        const artifact = JSON.parse(fs.readFileSync(path.join(ProjectPath, Config.dispatchAbi)));
        const address = artifact.networks[network_id].address;
        const provider = this.web3.currentProvider;

        return new Dispatch({ provider, address, artifact });
    }

    getRegistryInstance(network_id = this.currentNetwork.id) {
        const artifact = JSON.parse(fs.readFileSync(path.join(ProjectPath, Config.registryAbi)));
        const address = artifact.networks[network_id].address;
        const provider = this.web3.currentProvider;

        return new Registry({ provider, address, artifact });
    }

    getZapTokenInstance(network_id = this.currentNetwork.id) {
        const artifact = JSON.parse(fs.readFileSync(path.join(ProjectPath, Config.zapTokenAbi)));
        const address = artifact.networks[network_id].address;
        const provider = this.web3.currentProvider;

        return new ZapToken({ provider, address, artifact });
    }
}

module.exports = {
    toHex,
    getHexBuffer,
    getHexString,
    fixTruffleContractCompatibilityIssue,
    Loader
};