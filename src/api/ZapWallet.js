const Eth = require('ethjs');
const fs = require('fs');
const ZapBondage = require('./ZapBondage.js');

class ZapWallet {
    constructor(eth, network) {
        this.eth = eth;
        this.bondage = new ZapBondage(eth, network);

        const token_abi_file = fs.readFileSync('../contracts/abis/ZapToken.json');
        const token_abi_json = JSON.parse(token_abi_file);

        const addresses = fs.readFileSync('../contracts/' + network + '/address.json');
        const token_address = JSON.parse(addresses)['Token'];

        this.token_contract = eth.contract(token_abi_json).at(token_address);
    }

    // Get Balance in Zap
    getBalance(callback) {
        this.eth.accounts().then((accounts) => {
            if ( accounts.length == 0 ) {
                callback(new Error("No accounts loaded"));
                return;
            }

            const account = accounts[0];
            return this.token_contract.balanceOf(account);
        }).then((balance) => {
            callback(null, balance);
        }).catch((err) => {
            callback(err);
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

    // Bond a certain amount of Zap
    bond(oracle, endpoint, amount, callback) {
        // Estimate amount of Zap being spent
        this.bondage.estimateBond(oracle, endpoint, amount, (err, numZap, numDot) => {
            if ( err ) {
                callback(err);
                return;
            }

            // Approve to the token contract the spending
            this.token_contract.approve(this.bondage.address, numZap).then((success) => {
                if ( !success ) {
                    callback(new Error("Failed to approve Bondage transfer"));
                    return;
                }

                // Do the actual bondage
                this.bondage.bond(oracle, endpoint, amount, callback);
            }).catch((err) => {
                callback(err);
            });
        });
    }

    // Wrapper function for the unbond
    unbond(oracle, endpoint, amount, callback) {
        this.bondage.unbond(oracle, endpoint, amount, callback);
    }
}

module.exports = ZapWallet;
