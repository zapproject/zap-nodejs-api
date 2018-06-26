const Base = require('./Base');

class Bondage extends Base {


    constructor(){
        super(Base.getConfig().bondageArtifact)
    }
    // Do a bond to a ZapOracle's endpoint
    async bond({oracleAddress, endpoint, amountOfZap, from, gas}) {
        return await this.contract.bond(
            oracleAddress,
            web3.utils.utf8ToHex(endpoint),
            web3.utils.toBN(amountOfZap))
            .send({
                from: from,
                gas: gas || this.DEFAULT_GAS});
    }


    async unbond({oracleAddress, endpoint, amountOfDots, from, gas}) {
        return await this.contract.methods.unbond(
            oracleAddress,
            web3.utils.utf8ToHex(endpoint),
            web3.utils.toBN(amountOfDots))
            .send({
                from: from,
                gas: gas || this.DEFAULT_GAS});
    }

    async getBoundDots({subscriber, provider, endpoint}) {
        return await this.contract.methods.getBoundDots(
            subscriber,
            provider,
            this.web3.utils.utf8ToHex(endpoint),
        ).call();
    }

    async calcZapForDots({provider,endpoint,dots}){
        return await this.contract.methods.calcZapForDots(
            provider,
            this.web3.utils.utf8ToHex(endpoint),
            this.web3.utils.toBN(dots)).call();
    }

    async calcBondRate({provider,endpoint,numZap}){
        return await this.contract.methods.calcBondRate(
            provider,
            this.web3.utils.utf8ToHex(endpoint),
            this.web3.utils.toBN(numZap)
        ).call()
    }

    async currentCostOfDot({provider,endpoint,totalBound}){
        return this.contract.methods.currentCostOfDot(
            provider,
            this.web3.utils.utf8ToHex(endpoint),
            this.web3.utils.toBN(totalBound)
        ).call();
    }

    async getDotsIssued({provider,endpoint}){
        return this.contract.methods.getDotsIssued(
            provider,
            this.web3.utils.utf8ToHex(endpoint)
        ).call();
    }

    async getZapBound({provider,endpoint}){
        return this.contract.methods.getZapBound(
            provider,
            this.web3.utils.utf8ToHex(endpoint)
        ).call();
    }
}

module.exports = Bondage;
