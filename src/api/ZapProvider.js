const ZapArbiter = require('./contracts/ZapArbiter');
const EventEmitter = require('event');

class ZapProvider extends EventEmitter {
    constructor(eth, network) {
        super();

        this.arbiter = new ZapArbiter(eth, network);
        this.subscriptions = {}; // In-memory stored subscriptions
        this.handler = {};       // Map for handlers for different endpoints
    }

    // Add a given Handler
    addHandler(type, handler) {
        this.handler[type] = handler;
    }

    // Listen for new subscriptions
    listen(callback) {
        this.arbiter.listen((err, data) => {
            if ( err ) {
                callback(err);
                return;
            }

            const handler = this.handler[data.endpoint];

            if ( !handler ) {
                callback(new Error("Got unhandled endpoint " + data.endpoint));
                return;
            }

            const subscription = handler.parseSubscription(data);
            this.subscriptions.push(subscription);

            this.emit("new_subscription", data.subscriber);
        });
    }

    // Publish
    publish(endpoint, data) {
        if ( !data ) {
            data = endpoint;
            endpoint = null;
        }

        if ( endpoint ) {
            // Publish to a specific endpoint
            for ( const subscription of this.subscriptions[endpoint] ) {
                subscription.publish(data);
            }
        }
        else {
            // Publish to all endpoints
            for ( const endpoint in this.subscriptions ) {
                for ( const subscription of this.subscriptions[endpoint] ) {
                    subscription.publish(data);
                }
            }
        }
    }

    // Close the current listener
    close() {
        this.arbiter.close();
    }

}

module.exports = ZapProvider;
