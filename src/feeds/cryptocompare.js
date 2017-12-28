const ioclient = require('socket.io-client');
const ioserver = require('socket.io');
const EventEmitter = require('events')

class CryptoCompare extends EventEmitter {
    constructor(subList) {
        super();

        //start a ws server
        this.wsServer = ioserver(57819);

        //connect to cryptocompare ws server
        this.ccclient = ioclient("https://streamer.cryptocompare.com");

        this.timestamp = 0
        if (subList) {
            this.ccclient.emit('SubAdd', { subs: subList });
        }

        this.ccclient.on("m", (msg) => {
console.log(msg);
            let data = msg.split("~")
            if (data[0] === "0" && parseInt(data[6]) > parseInt(this.timestamp)) {
                let key = ["SubscriptionId", "ExchangeName", "FromCurrencySymbol", "ToCurrencySymbol", "Flag", "TradeId", "TimeStamp", "Quantity", "Price", "Total"];
                let returnMsg = {};
                for (let i = 0; i < data.length; i++) {
                    returnMsg[key[i]] = data[i];
                }
                console.log(JSON.stringify(returnMsg));
                this.emit("data", returnMsg);

                this.wsServer.sockets.emit("data", returnMsg);
            }
        });
    }

    //https://www.cryptocompare.com/api/#-api-web-socket-subscribe-
    subscribe(s) {
        if (s instanceof Array) {
            this.ccclient.emit('SubAdd', { subs: s });
        }
        else if (typeof s == "string"){
            this.ccclient.emit('SubAdd', { subs: [s] });
        }
        else {
            throw Error ("Input must be an array or string");
        }
    }

    setTimestamp(t) {
        this.timestamp = t;
    }
}

module.exports = CryptoCompare;
