const { fromAscii, toBN } = require('ethjs');

class ZapBondageStorage {
    constructor({ eth, contract_address, abiFile }) {
        this.eth = eth;
        this.address = contract_address;
        this.abiFile = abiFile;
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

module.exports = ZapBondageStorage;
