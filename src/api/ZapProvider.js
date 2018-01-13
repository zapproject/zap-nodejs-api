const EventEmitter = require('events');
const fs = require('fs');
const ZapArbiter = require('./ZapArbiter');

class ZapProvider extends EventEmitter {
    constructor(eth, network) {
        super();
        this.arbiter = new ZapArbiter(eth, network);
    }

    // Listen for new subscriptions
    listen(callback) {
        this.arbiter.listen((err, data) => {
            if ( err ) {
                callback(err);
                return;
            }

            this.emit('new_subscription', data);
        });
    }

    // Close the current listener
    close() {
        this.arbiter.close();
    }

}

module.exports = ZapProvider;
