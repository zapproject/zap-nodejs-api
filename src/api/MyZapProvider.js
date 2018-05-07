const Web3 = require('web3');


class MyZapProvider {

    constructor(provider) {
        if (provider === 'truffle_develop') {
            this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'));
        } else {
            this.web3 = new Web3(provider);
        }

        this.DISPATCH_QUERIES_EVENT = 'FulfillQuery';
    }

    subscribeDispatchQueries(dispatchAddress, callback) {
        this.queriesSubscription = this.web3.subscribe(this.DISPATCH_QUERIES_EVENT, {address: dispatchAddress}, callback);
    }

    unsubscribeDispatchQueries() {
        this.queriesSubscription.unsubscribe(function (error, success) {
            if (error) console.log('Error while unsubscribed from dispatch queries!');
            if (success) console.log('Successfully unsubscribed from dispatch queries.');
        });
    }

}

module.exports = MyZapProvider;