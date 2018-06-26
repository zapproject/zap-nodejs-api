const Provider = require('../components/Provider');
const Base = require('./Base');
const Web3 = require('web3');
const web3 = new Web3();

class ZapRegistry extends Base {

    constructor(){
        super(Base.getConfig().registryArtifact)
    }

    async initiateProvider({public_key, title, endpoint, endpoint_params, from, gas}) {
        try {
            return await this.contract.initiateProvider(
                public_key,
                title,
                endpoint,
                endpoint_params,
                {
                    from: from,
                    gas: gas || this.DEFAULT_GAS
                }
            );
        } catch (err) {
            throw err;
        }
    }

    async initiateProviderCurve({endpoint, curve, from, gas}) {
        try {
            return await this.contract.initiateProviderCurve(
                endpoint,
                curve.constants,
                curve.parts,
                curve.dividers,
                {
                    'from': from,
                    'gas': gas || this.DEFAULT_GAS
                }
            );
        } catch (err) {
            throw err;
        }
    }

    async setEndpointParams({endpoint, params, from, gas}) {
        try {
            let endpoint_params = [];
            params.forEach(el => endpoint_params.push(web3.utils.utf8ToHex(el)));
            return await this.contract.setEndpointParams(
                endpoint,
                endpoint_params,
                {
                    'from': from,
                    'gas': gas || this.DEFAULT_GAS
                }
            );
        } catch (err) {
            throw err;
        }
    }

    async getProviderPublicKey({provider}){
        return await this.contract.methods.getProviderPublicKey(provider).call()
    }

    async getProviderTitle({provider}){
        return await this.contract.methods.getProviderTitle(provider).call()
    }
    
    async getProviderCurve({provider}){
        return await this.contract.methods.getProviderCurve(provider).call()
    }

    async getNextProvider({index}){
        return await this.contract.methods.getNextProvider(index).call();
    }

    async getNextEndpointParams({provider,endpoint,index}){
        return this.contract.methods.getNextEndpointParam(
            provider,
            this.web3.utils.utf8ToHex(endpoint),
            this.web3.utils.toBN(index)
        ).call();
    }

}

module.exports = ZapRegistry;
