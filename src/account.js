const Wallet = require('ethereumjs-wallet');

//account wrapper. kind of silly now but useful to build on if using additional account features 
class Account{
    //args: hex string of private key
    constructor(secret, passphrase=false ){
        this.privateKeyHex = passphrase ? web3.sha3(secret) : secret;
        this.privateKeyBuffer = new Buffer(this.privateKeyHex.substr(2), 'hex');
        this.address = "0x" +  Wallet.fromPrivateKey(this.privateKeyBuffer).getAddress().toString('hex');
        //TODO this.publicKey = ...
    }
    //args: web3 object
    setWeb3(web3){
        web3.eth.accounts.wallet.add(this.privateKeyHex);
    }
    getAddress(){
        return this.address
    }
    getPublicKey(){
        //TODO
    }
    getPrivateKeyHex(){
        return this.privateKeyHex;
    }
    getPrivateKeyBuffer(){
        return this.privateKeyBuffer;
    }
}

module.exports = Account;
