const { fromAscii, toBN } = require('ethjs');
const { getABI } = require('../utils.js');

class BondageStorage {
    constructor(eth, network, contractAddress) {
        this.eth = eth;
        this.address = getAddress("BondageStorage", network, contractAddress);
        this.abiFile = getABI("BondageStorage");
        this.contract = eth.contract(this.abiFile).at(this.address);
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

module.exports = BondageStorage;
