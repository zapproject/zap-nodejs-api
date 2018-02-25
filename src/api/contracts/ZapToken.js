const Eth = require('ethjs');

class ZapToken {
    constructor({eth, contract_address, abiFile}) {
        this.eth = eth;
        this.token_address = contract_address;
        this.abiFile = abiFile;
        this.token_contract = eth.contract(abiFile).at(this.token_address);
    }

    // Get our address
    async getAddress() {
        try{
            const accounts = await this.eth.accounts();
            if(!accounts.length) {
                throw new Error('No accounts loaded');
            }
            return accounts[0];
        } catch(err) {
            throw err;
        }
    }
    
    async getBalance() {
        try {
            const address = await this.getAddress();
            return  await this.token_contract.balanceOf(address);
        } catch(err) {
            throw err;
        }
    }

    // Send Zap around
    async send(destination, amount) {
        try {
            amount = Eth.toBN(amount);
            return await this.token_contract.transfer(destination, amount);
        } catch(err) {
            throw err;
        }
    }

    // Approve a certain amount of zap to be sent
    approve(address, amount, callback) {
        // Approve to the token contract the spending
        this.token_contract.approve(this.bondage.address, amount).then((success) => {
            if ( !success ) {
                callback(new Error("Failed to approve Bondage transfer"));
                return;
            }

            callback(null);
        }).catch((err) => {
            callback(err);
        });
    }
}

module.exports = ZapToken;
