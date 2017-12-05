module.exports = function(arg) {
    const accounts = require('../account.js');
    const crypto = require('crypto');
    const fs = require('fs');
    const Web3 = require('web3');
    var CryptoJS = require("crypto-js");
    const ConfigStorage = require('./configstorage.js');
    var co = require('co');
    var prompt = require('co-prompt');
    var privateKeyHex;
    // Create a sending RPC
    const rpcHost = "https://rinkeby.infura.io";
    const web3 = new Web3(new Web3.providers.HttpProvider(rpcHost));

    // Create a listening RPC
    const rpcHost_listen = "ws://dendritic.network:8546";
    const web3_listen = new Web3(Web3.givenProvider || rpcHost_listen);
    const configFile = arg.fileName
    co(function*() {

        if (ConfigStorage.exists(__dirname + "/" + configFile)) {
            console.log("Loading configuration from", configFile);

            const data = JSON.parse(ConfigStorage.load(__dirname + "/" + configFile));
            var password = yield prompt.password('password: ');
            var bytes = CryptoJS.AES.decrypt(data.encryptedAccountKey, password);
            var privateKey = bytes.toString(CryptoJS.enc.Utf8);
            privateKeyHex = privateKey
            ConfigStorage.save('.currentAccount', JSON.stringify({
                privateKey: privateKeyHex

            }));

        }
        process.exit()

    });
}