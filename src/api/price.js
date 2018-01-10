const request = require('request');

function getMarketData(loc, callback) {
    request.get(loc, (err, res, body) => {
        if ( err || !res ) {
            callback(err || new Error("Failed to get response"));
            return;
        }

        if ( res.statusCode !== 200 ) {
            callback(new Error("Invalid status code: " + res.statusCode.toString()));
            return;
        }

        try {
            const parsed = JSON.parse(body);
            callback(null, parsed);
        }
        catch ( err ) {
            callback(err);
        }
    });
}

function getCryptopiaData(callback) {
    getMarketData('https://www.cryptopia.co.nz/api/GetMarket/ZAP_BTC', (err, data) => {
        if ( err ) {
            callback(err);
            return;
        }

        if ( !data.Success ) {
            callback(new Error(data.Message || "Cryptopia: Failed to get market data"));
            return;
        }

        callback(null, {
            price: data.Data.LastPrice,
            volume: data.Data.Volume
        });
    });
}

function getHitBTCData(callback) {
    getMarketData('https://api.hitbtc.com/api/2/public/ticker/ZAPBTC', (err, data) => {
        if ( err ) {
            callback(err);
            return;
        }

        callback(null, {
            price: data.last,
            volume: data.volume
        });
    });
}

function getZAPBTCAverage(callback) {
    getCryptopiaData((err, cryptopia) => {
        if ( err ) {
            callback(err);
            return;
        }

        getHitBTCData((err, hitbtc) => {
            if ( err ) {
                callback(err);
                return;
            }

            // Get total volume
            const total = cryptopia.volume + hitbtc.volume;

            console.log("Cryptopia Volume "+  cryptopia.volume);
            console.log("HitBTC Volume "+   hitbtc.volume);
            console.log("total volumes trading "+ total);

            // Get individual percentages for markets
            const cryptopia_percentage = cryptopia.volume / total;
            console.log("Cryptopia % " + cryptopia_percentage);

            const hitbtc_percentage = hitbtc.volume / total;
            console.log("hitBTC % "+ hitbtc_percentage);

            // Get weighted average
            const weighted_avg = (cryptopia.price * cryptopia_percentage) +
                                 (hitbtc.price * hitbtc_percentage);

            console.log("btc price of cryptopia " +(cryptopia.price));
            console.log("btc price of hitbtc " +(hitbtc.price));       
            
            console.log("btc price of cryptopia " +(cryptopia.price * cryptopia_percentage));
            console.log("btc price of hitbtc " +(hitbtc.price * hitbtc_percentage));
                                 
            callback(null, weighted_avg);
        });
    });
}

function getCoinbaseUSD(callback) {
    getMarketData("https://api.coinbase.com/v2/prices/BTC-USD/spot", (err, data) => {
        if ( err ) {
            callback(err);
            return;
        }

        callback(null, data.data.amount);
    });
}

module.exports = {
    price: (currency, callback) => {
        if ( currency == "BTC" ) {
            getZAPBTCAverage(callback);
        }
        else if ( currency == "USD" ) {
            getZAPBTCAverage((err, btcdata) => {
                if ( err ) {
                    callback(err);
                    return;
                }

                getCoinbaseUSD((err, usddata) => {
                    if ( err ) {
                        callback(err);
                        return;
                    }

                    callback(null, btcdata * usddata);
                });
            });
        }
        else {
            callback(new Error("Currency " + currency + " not supported."));
        }
    }
};
