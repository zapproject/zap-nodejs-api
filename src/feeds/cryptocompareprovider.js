const CryptoCompare = require('./cryptocompare.js');

module.exports = function(args) {

    const provider = args.provider;
    // console.log(provider);
    const cryptocompare = new CryptoCompare('0~Poloniex~BTC~USD');

    /*
     *socket  endpoint
     */

    //test
    setInterval( () => {
        provider.publish('test'+ (new Date().getTime/1000));
    }, 2000);

    cryptocompare.on("data", (data) => {
        console.log(data);
        provider.publish(data);
    })

    /*
     *smart contract endpoint
     */

    // Create a listening RPC
    const web3 = args.web3rpc;
 
    const fs = require('fs');
    const file = __dirname + "/../dataproxy/dispatch.abi.json";
    const ZapDataProxy_abi = JSON.parse(fs.readFileSync(file));
    const ZapDataProxy_address = "0x0753740e1939ff47c5b916bf6385c907333894f9";
    const ZapDataProxy_listen = new web3.eth.Contract(ZapDataProxy_abi, ZapDataProxy_address);

    //listen for conditions, TODO get filters to work
    ZapDataProxy_listen.events.OracleEventRequest({
        filter: { providerGroup: ["0x" + Buffer.from(provider.group).toString("hex")] }
    }, (err, result) => {
        // Ignore errors
        if (err) {
            throw err;
        }
        console.log("timestamp", web3.utils.toBN(result.returnValues.trigger).toString());
        cryptocompare.setTimestamp(web3.utils.toBN(result.returnValues.trigger).toString());
        
        let subString = Buffer.from(result.returnValues.var1.substring(2), "hex").toString().replace(/\u0000+$/gm, '');
        console.log(JSON.stringify(subString));
        //https://www.cryptocompare.com/api/#-api-web-socket-subscribe-
        cryptocompare.subscribe(subString);
    })
}
