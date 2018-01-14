const Eth = require('ethjs');
const fs = require('fs');

class ZapToken {
    constructor(eth, network) {
        this.eth = eth;

        const token_abi_file = fs.readFileSync('../contracts/abis/ZapToken.json');
        const token_abi_json = JSON.parse(token_abi_file);

        const addresses = fs.readFileSync('../contracts/' + network + '/address.json');
        const token_address = JSON.parse(addresses)['Token'];

        this.token_contract = eth.contract(token_abi_json).at(token_address);
    }

    // Get our address
    getAddress(callback) {
        this.eth.accounts().then((accounts) => {
            if ( accounts.length == 0 ) {
                callback(new Error("No accounts loaded"));
                return;
            }

            const account = accounts[0];
            callback(null, account);
        }).catch((err) => {
            callback(err);
        });
    }

    // Get Balance in Zap
    getBalance(callback) {
        this.getAddress((err, address) => {
            if ( err ) {
                callback(err);
                return;
            }

            this.token_contract.balanceOf(address).then((balance) => {
                callback(null, balance);
            }).catch((err) => {
                callback(err);
            });
        });
    }

    // Send Zap around
    send(destination, amount, callback) {
        amount = Eth.toBN(amount);

        this.token_contract.transfer(destination, amount).then((success) => {
            callback(null, success);
        }).catch((err) => {
            callback(err);
        });
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
