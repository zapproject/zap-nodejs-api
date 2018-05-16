const Base = require('./Base');

class Bondage extends Base {
    // Do a bond to a ZapOracle's endpoint
    async bond({oracleAddress, endpoint, amountOfZap, from, gas}) {
        const contractInstance = await this.contractInstance();
        return await contractInstance.bond(
            oracleAddress,
            endpoint,
            amountOfZap,
            {
                from: from,
                gas: gas
            }
        );
    }

    // Estimate amount of dots received from Bondage
    async estimateBond({oracleAddress, endpoint, amountOfZap, gas}) {
        const contractInstance = await this.contractInstance();
        return await contractInstance.calcZapForDots(
            oracleAddress,
            endpoint,
            amountOfZap,
            {
                gas: gas
            }
        );
    }

    // Do an unbond to a ZapOracle's endpoint
    async unbond({oracleAddress, endpoint, amountOfDots, from, gas}) {
        const contractInstance = await this.contractInstance();
        return await contractInstance.unbond(
            oracleAddress,
            endpoint,
            amountOfDots,
            {
                from: from,
                gas: gas
            }
        );
    }

    //get counts of dots regarding provided oracle
    async getBoundDots({holderAddress, oracleAddress, specifier}) {
        const contractInstance = await this.contractInstance();
        return await contractInstance.getBoundDots(
            holderAddress,
            oracleAddress,
            specifier,
        );
    }
}

module.exports = Bondage;
