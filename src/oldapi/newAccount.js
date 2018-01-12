const Web3 = require('web3');
var CryptoJS = require("crypto-js");
const ConfigStorage = require('./configstorage.js');
var co = require('co');
var prompt = require('co-prompt');
// Create a listening RPC
const rpcHost_listen = "ws://dendritic.network:8546";
const web3_listen = new Web3(Web3.givenProvider || rpcHost_listen);

const account = web3_listen.eth.accounts.create();
console.log("Account created with Address: ",account.address);
co(function*() {
    var password = yield prompt.password('Set password to protect to your account: ');
    var ciphertext = CryptoJS.AES.encrypt(account.privateKey, password).toString();
    console.log("Done!");
    ConfigStorage.save(__dirname+"/."+account.address, JSON.stringify({
        encryptedAccountKey: ciphertext

    }));
    process.exit();

});
