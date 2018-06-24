const Base = require('./Base');

class Bondage extends Base {
    constructor(){
        super(Base.getConfig().bondageArtifact)
    }
    // Do a bond to a ZapOracle's endpoint
    async bond({oracleAddress, endpoint, amountOfZap, from, gas}) {
        return await this.contract.bond(
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
        return await this.contract.calcZapForDots(
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
        return await this.contract.unbond(
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
        return await this.contract.getBoundDots(
            holderAddress,
            oracleAddress,
            specifier,
        );
    }
}

module.exports = Bondage;
