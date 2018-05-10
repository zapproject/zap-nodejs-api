const Arbiter = require('./contracts/Arbiter');
const Dispatch = require('./contracts/Dispatch');
const EventEmitter = require('event');

class Provider extends EventEmitter {
    constructor(eth, network, arbiterAddress, dispatchAddress) {
        super();

        this.arbiter = new Arbiter(eth, network, arbiterAddress);
        this.dispatch = new Dispatch(eth, network, dispatchAddress);
        this.subscriptions = {}; // In-memory stored subscriptions
        this.requests = {};      // In-memory stored oracle requests 
        this.handler = {};       // Map for handlers for different endpoints
    }

    // Add a given Handler
    addHandler(type, handler) {
        this.handler[type] = handler;
    }

    // Listen for new subscriptions 
    listenSubscription(callback) {

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

    listenOracle(callback){

        this.dispatch.listen((err, data) => {
            if ( err ) {
                callback(err);
                return;
            }

            const handler = this.handler[data.endpoint];

            if ( !handler ) {
                callback(new Error("Got unhandled endpoint " + data.endpoint));
                return;
            }

            const request = handler.parseRequest(data);
            this.requests.push(request);
            callback(null, this);
            this.emit("new_oracle_request", data.id);
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
    
    respond(endpoint, data){
        this.dispatch.respond(data.id, data.params);
    }

    // Close the current listener
    close() {
        this.arbiter.close();
        this.dispatch.close();
    }

}

module.exports = Provider;
