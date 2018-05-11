class ZapBondage {
    constructor({ web3, contract_address, abi }) {
        this.eth = web3;
        this.address = contract_address;
        this.abi = abi;
        this.contract = new this.web3.eth.Contract(this.abi, this.address);
    }

    // Do a bond to a ZapOracle's endpoint
    bond({ oracleAddress, endpoint, amount, from, gas }) {
        endpoint = this.web3.utils.utf8ToHex(endpoint);
        amount = new this.web3.utils.BN(amount);
        return this.contract.methods.bond(
            oracleAddress,
            endpoint,
            amount,
            ).send({
                'from': from,
                'gas': gas
            }
        );
    }

    // Estimate amount of dots received from Bondage
    estimateBond({ oracleAddress, endpoint, amount, from, gas }) {
        endpoint = this.web3.utils.utf8ToHex(endpoint);
        amount = new this.web3.utils.BN(amount);
        return this.contract.methods.calcTokForDots(
            oracleAddress,
            endpoint,
            amount,
            ).send({
                'from': from,
                'gas': gas
            }
        );
    }

    // Do an unbond to a ZapOracle's endpoint
    unbond({ oracleAddress, endpoint, amount, from, gas }) {
        endpoint = this.web3.utils.utf8ToHex(endpoint);
        amount = new this.web3.utils.BN(amount);

        return this.contract.methods.unbond(
            oracleAddress,
            endpoint,
            amount,
            ).send({
                'from': from,
                'gas': gas
            }
        );
    }

    // Get amount of dots
    getDots({holderAddress, oracleAddress, endpoint, from, gas}) {
        endpoint = this.web3.utils.utf8ToHex(endpoint);
        return this.contract.methods.getDots(
            holderAddress,
            oracleAddress,
            endpoint,
            ).send({
                'from': from,
                'gas': gas
            }
        );
    }

    //get number of oracle addresses
    getIndexSize({ holderAddress, from, gas }) {
        return this.contract.methods.getIndexSize(
            holderAddress,
            ).send({
                'from': from,
                'gas': gas
            }
        );
    }

    //get oracle address depend on his index
    getOracleAddress({ holderAddress, index, from, gas }) {
        return this.contract.methods.getOracleAddress(
            holderAddress,
            index,
            ).send({
                'from': from,
                'gas': gas
            }
        );
    }

    //get counts of dots regarding provided oracle
    getBoundDots({ holderAddress, oracleAddress, specifier, from, gas }) {
        specifier = web3.utils.utf8ToHex(specifier);
        return this.contract.methods.getBoundDots(
            holderAddress,
            oracleAddress,
            specifier,
            ).send({
                'from': from,
                'gas': gas
            }
        );
    }
}

module.exports = ZapBondage;
