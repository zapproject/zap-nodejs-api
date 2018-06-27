const Base = require('./Base');
const {toBase} = require('./../utils')
class Bondage extends Base {


  constructor(){
    super(Base.getConfig().bondageArtifact);
  }
  // Do a bond to a ZapOracle's endpoint
  async bond({provider, endpoint, zapNum, from, gas}) {
    try{
      let bondResult = await this.contract.bond(
        provider,
        this.web3.utils.utf8ToHex(endpoint),
        toBase(zapNum))
        .send({
          from: from,
          gas: gas || this.DEFAULT_GAS});
      return bondResult;
    }catch(e){
      console.error(e);
      return 0;
    }

  }


  async unbond({oracleAddress, endpoint, dots, from, gas}) {
    return await this.contract.methods.unbond(
      oracleAddress,
      this.web3.utils.utf8ToHex(endpoint),
      this.web3.utils.toBN(dots))
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

  async calcZapForDots({provider, endpoint, dots}){
    return await this.contract.methods.calcZapForDots(
      provider,
      this.web3.utils.utf8ToHex(endpoint),
      this.web3.utils.toBN(dots)).call();
  }

  async calcBondRate({provider, endpoint, numZap}){
    return await this.contract.methods.calcBondRate(
      provider,
      this.web3.utils.utf8ToHex(endpoint),
      this.web3.utils.toBN(numZap)
    ).call();
  }

  async currentCostOfDot({provider, endpoint, totalBound}){
    return this.contract.methods.currentCostOfDot(
      provider,
      this.web3.utils.utf8ToHex(endpoint),
      this.web3.utils.toBN(totalBound)
    ).call();
  }

  async getDotsIssued({provider, endpoint}){
    return this.contract.methods.getDotsIssued(
      provider,
      this.web3.utils.utf8ToHex(endpoint)
    ).call();
  }

  async getZapBound({provider, endpoint}){
    return this.contract.methods.getZapBound(
      provider,
      this.web3.utils.utf8ToHex(endpoint)
    ).call();
  }

  listen(filters, callback){
    this.contract.events.allEvents(filters, {fromBlock: 0, toBlock: 'latest'}, callback);
  }

  listenBound(filters, callback){
    this.contract.events.Bound(filters, {toBlock: 'latest'}, callback);
  }

  listenUnbound(filters, callback){
    this.contract.events.Unbond(filters, {toBlock: 'latest'}, callback);
  }

  listenEscrowed(filters, callback){
    this.contract.events.Escrowed(filters, {toBlock: 'latest'}, callback);
  }

  listenReleased(filters, callback){
    this.contract.events.Released(filters, {toBlock: 'latest'}, callback);
  }

}

module.exports = new Bondage();
