const { fromAscii, toBN } = require('ethjs');
const { getABI, getAddress } = require('../utils.js');

class Bondage {
    constructor(eth, network, contractAddress) {
        this.eth = eth;
        this.address = getAddress("Bondage", network, contractAddress);
        this.abiFile = getABI("Bondage");
        this.contract = eth.contract(this.abiFile).at(this.address);
    }

    // Do a bond to a Oracle's endpoint
    bond({ oracleAddress, endpoint, amount, from, gas }) {
        endpoint = fromAscii(endpoint);
        amount = toBN(amount);
        return this.contract.bond(
            oracleAddress,
            endpoint,
            amount,
            {
                'from': from,
                'gas': gas
            }
        );
    }

    // Estimate amount of dots received from Bondage
    estimateBond({ oracleAddress, endpoint, amount, from, gas }) {
        endpoint = fromAscii(endpoint);
        amount = toBN(amount);
        return this.contract.calcTokForDots(
            oracleAddress,
            endpoint,
            amount,
            {
                'from': from,
                'gas': gas
            }
        );
    }

    // Do an unbond to a Oracle's endpoint
    unbond({ oracleAddress, endpoint, amount, from, gas }) {
        endpoint = fromAscii(endpoint);
        amount = toBN(amount);

        return this.contract.unbond(
            oracleAddress,
            endpoint,
            amount,
            {
                'from': from,
                'gas': gas
            }
        );
    }

    // Get amount of dots
    getDots({holderAddress, oracleAddress, endpoint, from, gas}) {
        endpoint = fromAscii(endpoint);
        return this.contract.getDots(
            holderAddress,
            oracleAddress,
            endpoint,
            {
                'from': from,
                'gas': gas
            }
        );
    }

    //get number of oracle addresses
    getIndexSize({ holderAddress, from, gas }) {
        return this.contract.getIndexSize(
            holderAddress,
            {
                'from': from,
                'gas': gas
            }
        );
    }

    //get oracle address depend on his index
    getOracleAddress({ holderAddress, index, from, gas }) {
        return this.contract.getOracleAddress(
            holderAddress,
            index,
            {
                'from': from,
                'gas': gas
            }
        );
    }

    //get counts of dots regarding provided oracle
    getBoundDots({ holderAddress, oracleAddress, specifier, from, gas }) {
        specifier = fromAscii(specifier);
        return this.contract.getBoundDots(
            holderAddress,
            oracleAddress,
            specifier,
            {
                'from': from,
                'gas': gas
            }
        );
    }
}

module.exports = Bondage;
