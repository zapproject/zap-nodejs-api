const ZapArbiter = require('./contracts/ZapArbiter');

class ZapProvider {
    constructor(eth, network) {
        this.arbiter = new ZapArbiter(eth, network);
    }

    // Listen for new subscriptions
    listen(callback) {
        this.arbiter.listen((err, data) => {
            if ( err ) {
                callback(err);
                return;
            }

            callback(null, data);
        });
    }

    // Close the current listener
    close() {
        this.arbiter.close();
    }

}

module.exports = ZapProvider;
