const ZapBondage = require('./contracts/ZapBondage.js');
const ZapToken = require('./contracts/ZapToken.js');

class ZapWallet {
    constructor(eth, network) {
        this.eth = eth;

        this.bondage = new ZapBondage(eth, network);
        this.token = new ZapToken(eth, network);
    }

    // Get our address
    getAddress(callback) {
        this.token.getAddress(callback);
    }

    // Get Balance in Zap or Dots
    getBalance(oracle, endpoint, callback) {
        if ( typeof oracle == 'function' ) {
            // If no currency given, zap is shown.
            callback = oracle;
            oracle = null;
        }

        if ( !oracle ) {
            this.token.getBalance(callback);
        }
        else {
            this.bondage.getDots(oracle, endpoint, callback);
        }
    }

    // Send Zap around
    send(destination, amount, callback) {
        this.token.send(destination, amount, callback);
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
            this.token.approve(this.bondage.address, numZap, err => {
                if ( err ) {
                    callback(err);
                    return;
                }

                // Do the actual bondage
                this.bondage.bond(oracle, endpoint, amount, callback);
            });
        });
    }

    // Wrapper function for the unbond
    unbond(oracle, endpoint, amount, callback) {
        this.bondage.unbond(oracle, endpoint, amount, callback);
    }
}

module.exports = ZapWallet;
