const fs = require('fs');
const crypto = require('crypto');
const Web3 = require('web3');
const SynapseSubscription = require('./subscription.js');

//network
// const rpcHost = "http://rinkeby.infura.io";

//market contract
const file = "./market/contracts/abi.json";
const abi = JSON.parse(fs.readFileSync(file));
const marketAddress = "0x98f6d007a840782eea0fbc6584ab95e8c86d677e";

// Create a sending RPC
const rpcHost = "http://localhost:8545";
const web3 = new Web3(Web3.givenProvider || rpcHost);
const SynapseMarket = new web3.eth.Contract(abi, marketAddress);

// Create a listening RPC
const rpcHost_listen = "ws://localhost:8546";
const web3_listen = new Web3(Web3.givenProvider || rpcHost_listen);
const SynapseMarket_listen = new web3_listen.eth.Contract(abi, marketAddress);

//accounts
const accounts = require('./account.js');
const privateKeyHex = "0x8d2246c6f1238a97e84f39e18f84593a44e6622b67b8cebb7788320486141f95";
const account = new accounts(privateKeyHex);

account.setWeb3(web3);
console.log(web3.eth.accounts.wallet[0].address);

class SynapseProvider {
    constructor(group, wei_rate, configFile = ".synapseprovider") {
        this.group = new Buffer(group).toString('hex');
        this.marketInstance = SynapseMarket;
        this.checkForRegister(configFile, group, wei_rate, () => {
            this.listenForEvent();
            this.listenForBlocks();
            this.listenForTerms();
        });
    }

    // Check whether or not we need to register, if so register
    checkForRegister(configFile, group, wei_rate, callback) {
        // Already regsitered
        if ( fs.existsSync(configFile) ) {
            console.log("Loading configuration from", configFile);

            const data = JSON.parse(fs.readFileSync(configFile));
            this.private_key = data.private_key;

            // Generate a secp224k1 keypair
            this.keypair = crypto.createECDH('secp224k1');
            this.keypair.setPrivateKey(data.private_key, 'hex');

            // Load the subscriptions into internal objects
            this.subscriptions = data.subscriptions.map(data => SynapseSubscription.fromObject(data));

            callback();
            return;
        }

        // Don't overflow a solidity bytes32
        if ( group.length > 32 ) {
            throw new Error("Group size is greater than 32 in length!");
        }

        this.keypair = crypto.createECDH('secp224k1');

        const public_key = "0x" + this.keypair.generateKeys('hex', 'compressed');

        console.log("Created public key", public_key);

        // Make the request
        this.marketInstance.methods.registerSynapseProvider(web3.utils.fromUtf8(group), web3.utils.toBN(public_key), wei_rate).send({
            gas: 300000,
            from: web3.eth.accounts.wallet[0].address
        }, (err, result) => {
            if ( err ) {
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
        SynapseMarket_listen.events.SynapseDataPurchase([
            { provider: web3.eth.accounts.wallet[0].address }
        ], (err, result) => {
            // Ignore errors
            if ( err ) {
                throw err;
            }

            if ( !result.args ) {
                return;
            }

            this.initSubscription(result.blockNumber, result.args);
        });
    }

    // Listen for Ethereum blocks to end subscriptions
    listenForBlocks() {
        web3_listen.eth.subscribe('newBlockHeaders', (err, result) => {
            const blocknum = result.number;

            // Filter out any old subscriptions
            this.subscriptions = this.subscriptions.filter(subscription => {
                if ( subscription.endblock <= blocknum ) {
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
            if ( err ) {
                throw err;
            }

            if ( !result.args ) {
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

        // Get the subscriber's public key
        const subscriber_public = data.public_key.substring(2); // bytes32 comes as 0x...

        // Calculate the secret key
        const secrethex = this.keypair.computeSecret(subscriber_public, 'hex');
        const noncehex = data.nonce.substring(2);

        // Get the relevant data as raw buffers
        const secret = new Buffer(secrethex, 16);
        const nonce = new Buffer(noncehex, 16);
        const cipher_text = new Buffer(data.encrypted_uuid.substring(2), 16);

        // Create the decipher object
        const cipher = crypto.createDecipheriv('aes-256-ctr', secret, nonce);

        // Add it to the decipher stream and decrypt to String
        const uuid = cipher.update(cipher_text)
                   + cipher.final('base64');

        console.log("Starting subscription with", data.subscriber, "on", uuid);

        // Create an internal subscription object and begin it
        this.subscriptions.push(new SynapseSubscription(
            data.subscriber,
            secrethex,
            noncehex,
            blocknumber + blocks + 1, // End block is the last block + 1
            uuid
        ));
    }

    // Publish data to the subscribers
    publish(data) {
        // TODO - publish to Synapse oricalizer
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
            gas: 300000 // TODO - not this
        }, (err, result) => {
            if ( err ) {
                throw err;
            }

            console.log("Ended subscription with", subscription);
        });
    }
}

const provider = new SynapseProvider("cool2", 200);


module.exports = SynapseProvider;
