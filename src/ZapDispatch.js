const Eth = require('ethjs');
const fs = require('fs');

class ZapDispatch {

    constructor(eth, network){
        
        this.eth = eth;

        const dispatch_abi_file = fs.readFileSync('../../contracts/abis/ZapDispatch.json');
        const dispatch_abi_json = JSONparse(dispatch_abi_file);
        const dispatch_address = JSON.parse(addresses)['Dispatch'];

        this.contract = eth.contract(dispatch_abi_json).at(dispatch_address);
    }

    



}
