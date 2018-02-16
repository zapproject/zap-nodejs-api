require('babel-register');
const Eth = require('ethjs');
const fs = require('fs');

class ZapDispatch {
    constructor(eth, network) {
        this.eth = eth;

        const dispatch_abi_file = fs.readFileSync('../../contracts/abis/ZapDispatch.json');
        const dispatch_abi_json = JSON.parse(dispatch_abi_file);

        const addresses = fs.readFileSync('../../contracts/' + network + '/address.json');
        const dispatch_address = JSON.parse(addresses)['Dispatch'];

        this.dispatch_contract = eth.contract(dispatch_abi_json).at(dispatch_address);
    }

    // Listen for oracle queries 
    listen(callback) {
        this.eth.accounts().then((accounts) => {
            if ( accounts.length == 0 ) {
                callback(new Error("No accounts loaded"));
                return;
            }

            const account = accounts[0];

            // Create the Event filter
            this.filter = this.contract.Incoming().new((err, res) => {
                if ( err ) {
                    callback(err);
                }
            });

            // Watch the event filter
            this.filter.watch().then((result) => {
                // Sanity check
                if ( result.length != 5 ) {
                    callback(new Error("Received invalid ZapDataPurchase event"));
                    return;
                }

                // Make sure it is us
                if ( result[1] != account ) {
                    return;
                }

                // Emit event
                callback(null, {
                    id: result[0],
                    provider: result[1],
                    recipient: result[2],
                    query: result[3],
                    endpoint: result[4],
                    endpoint_params: result[5]
                });

            }).catch((err) => {
                callback(err);
            });
        });
    }

    // Close the connection
    close() {
        if ( this.filter ) {
            this.filter.stopWatching();
            delete this.filter;
        }
    }

    respond(queryId, responseParams, callback) {
        switch(responseParams.length){
            case 1:
                this.dispatch_contract.respond1(queryId, responseParam1).then((success) =>{
                    callback(null, success);

                }).catch((err) => {
                    callback(err);
                });
                break;
            case 2:
                this.dispatch_contract.respond2(queryId, responseParam1, repsonseParam2).then((success) =>{
                    callback(null, success);

                }).catch((err) => {
                    callback(err);
                });
                break;
            case 3:
                this.dispatch_contract.respond3(queryId, responseParam1, repsonseParam2, repsonseParam3).then((success) =>{
                    callback(null, success);

                }).catch((err) => {
                    callback(err);
                });
                break;
            case 4:
                this.dispatch_contract.respond4(queryId, responseParam1, repsonseParam2, repsonseParam3, responseParam4).then((success) =>{
                    callback(null, success);

                }).catch((err) => {
                    callback(err);
                });
                break;
            default:
                callback("Invalid number of response parameters");            
        }
    }
}

module.exports = ZapDispatch;
