const Eth = require('ethjs');
const fs = require('fs');

class ZapBondage {
    constructor(eth, network) {
        this.eth = eth;

        const bondage_abi_file = fs.readFileSync('../contracts/abis/Bondage.json');
        const bondage_abi_json = JSON.parse(bondage_abi_file);

        const addresses = fs.readFileSync('../contracts/' + network + '/address.json');
        const bondage_address = JSON.parse(addresses)['Bondage'];

        this.contract = eth.contract(bondage_abi_json).at(bondage_address);
    }

    // Do a bond to a ZapOracle's endpoint
    bond(oracle, endpoint, amount, callback) {
        const address = oracle.address;
        endpoint = Eth.fromAscii(endpoint);
        amount = Eth.toBN(amount);

        this.contract.bond(endpoint, amount, address).then(() => {
            callback && callback(null);
        }).catch((err) => {
            callback && callback(err);
        });
    }

    // Estimate amount of dots received from Bondage
    estimateBond(oracle, endpoint, amount, callback) {
        const address = oracle.address;
        endpoint = Eth.fromAscii(endpoint);
        amount = Eth.toBN(amount);

        this.contract.calcZap(address, endpoint, amount).then((numZap, numDots) => {
            callback(null, numZap, numDots);
        }).catch((err) => {
            callback(err);
        });
    }

    // Do an unbond to a ZapOracle's endpoint
    unbond(oracle, endpoint, amount, callback) {
        const address = oracle.address;
        endpoint = Eth.fromAscii(endpoint);
        amount = Eth.toBN(amount);

        this.contract.unbond(endpoint, amount, address).then(() => {
            callback && callback(null);
        }).catch((err) => {
            callback && callback(err);
        });
    }

    // Get amount of dots
    getDots(oracle, endpoint, callback) {
        const address = oracle.address;
        endpoint = Eth.fromAscii(endpoint);

        this.contract.getDots(endpoint, address).then(() => {
            callback && callback(null);
        }).catch((err) => {
            callback && callback(err);
        });
    }
}
