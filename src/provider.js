const fs = require('fs');
const crypto = require('crypto');
const Web3 = require('web3');
const SynapseSubscription = require('./subscription.js');

// Market contract
const file = "./market/contracts/abi.json";
const abi = JSON.parse(fs.readFileSync(file));

//old contract
//const marketAddress = "0x98f6d007a840782eea0fbc6584ab95e8c86d677e";
//const marketAddress = "0x7A787becFCD206EF969e3399B3cbEA8b4a15C2e8";
const marketAddress = "0x732a5496383DE6A55AE2Acc8829BE7eCE0833113";
//const marketAddress = "0xbb6FaF6972EF22Fb3dea4a8A33e9b04CF361712A";



// Create a sending RPC
//const rpcHost = "http://34.229.146.100:8545";
//const web3 = new Web3(Web3.givenProvider || rpcHost);
const rpcHost = "https://rinkeby.infura.io";
const web3 = new Web3(new Web3.providers.HttpProvider(rpcHost));
const SynapseMarket = new web3.eth.Contract(abi, marketAddress);

// Create a listening RPC
const rpcHost_listen = "ws://localhost:8546";
const web3_listen = new Web3(Web3.givenProvider || rpcHost_listen);
const SynapseMarket_listen = new web3_listen.eth.Contract(abi, marketAddress);
//SynapseMarket_listen.events.allEvents({},(err,res)=>{console.log("76575event",err,JSON.stringify(res.returnValues))})

// Accounts
const accounts = require('./account.js');
const privateKeyHex = "0x6a7dfdf48155aa5d7654f392027e143d61dfe23ca2d9a8bbe7395192ffbd22d5";
const account = new accounts(privateKeyHex);

account.setWeb3(web3);
console.log(web3.eth.accounts.wallet[0].address);

//const EventEmitter = require('events').EventEmitter;

function sha256(item) {
    const hash = crypto.createHash("sha256");
    hash.update(item);
    return hash.digest();
}

class SynapseProvider {
    constructor(group, wei_rate, configFile = ".synapseprovider") {
        this.group = new Buffer(group).toString('hex');
        this.marketInstance = SynapseMarket;
        this.checkForRegister(configFile, group, wei_rate, () => {
            this.listenForEvent();
            this.listenForBlocks();
            this.listenForTerms();
            this.testInterval();
        });
    }

    testInterval(){
        setInterval(() => {
            console.log("Publishing new data");
            this.publish('test');
        }, 10000);
    }

    // Check whether or not we need to register, if so register
    checkForRegister(configFile, group, wei_rate, callback) {
        // Already regsitered
        if (fs.existsSync(configFile)) {
            console.log("Loading configuration from", configFile);

            const data = JSON.parse(fs.readFileSync(configFile));
            this.private_key = data.private_key;

            // Generate a secp224k1 keypair
            this.keypair = crypto.createECDH('secp224k1');
            this.keypair.setPrivateKey(data.private_key, 'hex');

            console.log ("public key", this.keypair.getPublicKey('hex', 'compressed'));
            console.log ("private key", this.keypair.getPrivateKey('hex'));

            // Load the subscriptions into internal objects
            this.subscriptions = data.subscriptions.map(data => SynapseSubscription.fromObject(data));

            callback();
            return;
        }

        // Don't overflow a solidity bytes32
        if (group.length > 32) {
            throw new Error("Group size is greater than 32 in length!");
        }

        this.keypair = crypto.createECDH('secp224k1');

        const public_key = "0x" + this.keypair.generateKeys('hex', 'compressed');

        console.log("Created public key", public_key);

        // Make the request
        /*
        this.marketInstance.methods.registerSynapseProvider(web3.utils.fromUtf8(group), web3.utils.toBN(public_key), wei_rate).send({
            gas: 300000,
            from: web3.eth.accounts.wallet[0].address
        }).on('error',(error)=>{
            throw error;
        }).then((receipt)=>{
            //maybe do another call instead?
            fs.writeFileSync(".synapseprovider", JSON.stringify({
                private_key: this.keypair.getPrivateKey('hex'),
                subscriptions: []
            }));

            this.subscriptions = [];

            console.log("Created the provider!");

            callback();
        })
        */

        this.marketInstance.methods.registerSynapseProvider(web3.utils.fromUtf8(group), public_key, wei_rate).send({
            gas: 300000,
            from: web3.eth.accounts.wallet[0].address
        }, (err, result) => {
            if (err) {
                throw err;
            }
            fs.writeFileSync(".synapseprovider", JSON.stringify({
                private_key: this.keypair.getPrivateKey('hex'),
                subscriptions: []
            }));

            this.subscriptions = [];

            console.log("Created the provider!");

            callback();
        });
    }

    // Wait for subscription events
    listenForEvent() {
        // Wait for events of SynapseDataPurchase type with a provider that is us
        SynapseMarket_listen.events.SynapseDataPurchase({
            filter: { provider: web3.eth.accounts.wallet[0].address }
        }, (err, result) => {
            // Ignore errors
            if (err) {
                throw err;
            }

            console.log(result.returnValues.provider);

            if (!result.args) {
                //return;
            }
            console.log("initSubscription",result.blockNumber, result.returnValues);
            this.initSubscription(result.blockNumber, result.returnValues);
        });
    }

    // Listen for Ethereum blocks to end subscriptions
    listenForBlocks() {
        web3_listen.eth.subscribe('newBlockHeaders', (err, result) => {
            const blocknum = result.number;

            // Filter out any old subscriptions
            this.subscriptions = this.subscriptions.filter(subscription => {
                if (subscription.endblock <= blocknum) {
                    console.log("Finished contract, emitting termination...");

                    this.terminateSubscription(subscription);

                    return false;
                }

                return true;
            });
        });
    }

    // Listen for terminations that wasn't initiated by us
    listenForTerms() {
        SynapseMarket_listen.events.SynapseDataSubscriptionEnd([
            {
                provider: web3.eth.accounts[0],
                terminator: 1 // Subscriber temrinated
            }
        ], (err, result) => {
            if (err) {
                throw err;
            }

            if (!result.args) {
                return;
            }

            console.log("Subscription has been terminated by ", result.args.subscriber);

            // Filter out the dead subscription
            this.subscriptions = this.subscriptions.filter(subscription => subscription.address == result.args.subscriber);
        });
    }

    // Initialize the subscription object from the ethereum event
    initSubscription(blocknumber, data) {
        // data's fields:
        // - public_key: BigNumber (uint256)
        // - amount: BigNumber (uint256)
        // - encrypted_uuid: bytes32
        // - nonce: bytes32

        const blocks = Math.floor(data.amount / this.wei_rate);

        //data.public_key = web3.utils.toBN(data.public_key).toString(16);

        console.log ("public key",data.public_key);

        // Get the subscriber's public key
        const subscriber_public = data.public_key.slice(2,-6); // bytes32 comes as 0x...

        console.log ("public key",data.public_key, subscriber_public);
       	 
       	const subscriber_public_buf = Buffer.from(subscriber_public, 'hex'); 
         // Calculate the secret key
        const secrethex = this.keypair.computeSecret(subscriber_public, 'hex', 'hex');

        const noncehex = data.nonce.substring(2);
        const secret = sha256(secrethex);
        const nonce = Buffer.from(noncehex.slice(0,32),"hex");

 	       
        const cipher_text = data.encrypted_uuid.substring(2);
        // Create the decipher object
        const cipher = crypto.createDecipheriv('aes-256-ctr', secret, nonce);

        // Add it to the decipher stream and decrypt to String
	const uuid = Buffer.concat([cipher.update(cipher_text,'hex'), cipher.final()]).toString('base64');

        console.log("Starting subscription with", data.subscriber, "on", uuid);

        // Create an internal subscription object and begin it
        this.subscriptions.push(new SynapseSubscription(
            data.subscriber,
            secret,
            nonce,
            blocknumber + blocks + 1, // End block is the last block + 1
            uuid
        ));
    }

    // Publish data to the subscribers
    publish(data) {
        // TODO - publish to Synapse oricalizer
        console.log("publish", this.subscriptions);
        this.subscriptions.forEach(subscription => {
            subscription.publish(data);
        });
    }

    // Save the necessary data into the ~/.synapseprovider field
    close() {
        // Save private key and the serialized subscribers

        fs.writeFileSync(JSON.stringify({
            private_key: this.keypair.getPrivateKey(),
            subscribers: this.subscriptions.map(subscriber => subscriber.toObject())
        }));
    }

    // End a subscription
    terminateSubscription(subscription) {
        // group
        // provider_address
        // subscriber_address
        //TODO
        this.marketInstance.methods.sendSynapseSubscription_Provider(this.group, subscription.address).send({
            from: web3.eth.accounts.wallet[0].address,
            gas: 900000 // TODO - not this
        }, (err, result) => {
            if (err) {
                throw err;
            }

            console.log("Ended subscription with", subscription);
        });
    }
}

const provider = new SynapseProvider("tom_09", 1);
//provider.on('ready', () => {})



module.exports = SynapseProvider;
