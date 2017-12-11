module.exports = function(arg) {
    var CryptoJS = require("crypto-js");
    const ConfigStorage = require('./configstorage.js');
    var co = require('co');
    var prompt = require('co-prompt');
    var privateKeyHex;
    const configFile = arg.fileName;
    co(function*() {

        if (ConfigStorage.exists(__dirname + "/" + configFile)) {
            console.log("Loading configuration from", configFile);

            const data = JSON.parse(ConfigStorage.load(__dirname + "/" + configFile));
            var password = yield prompt.password('password: ');
            var bytes = CryptoJS.AES.decrypt(data.encryptedAccountKey, password);
            var privateKey = bytes.toString(CryptoJS.enc.Utf8);
            privateKeyHex = privateKey;
            ConfigStorage.save(__dirname+'/.currentAccount', JSON.stringify({
                privateKey: privateKeyHex

            }));

        }
        process.exit();

    });
};
