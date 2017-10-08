const accounts = require('../account.js');
const crypto = require('crypto');
const ConfigStorage = require('./configstorage.js');
const fs = require('fs');
const Web3 = require('web3');
const SharedCrypto = require('./sharedcrypto.js');
const SynapseSubscription = require('./subscription.js');

// Market contract
const file = "../market/contracts/abi.json";
const abi = JSON.parse(fs.readFileSync(file));
const marketAddress = "0x732a5496383DE6A55AE2Acc8829BE7eCE0833113";

// Create a sending RPC
const rpcHost = "https://rinkeby.infura.io";
const web3 = new Web3(new Web3.providers.HttpProvider(rpcHost));
const SynapseMarket = new web3.eth.Contract(abi, marketAddress);

// Create a listening RPC
const rpcHost_listen = "ws://dendritic.network:8546";
const web3_listen = new Web3(Web3.givenProvider || rpcHost_listen);
const SynapseMarket_listen = new web3_listen.eth.Contract(abi, marketAddress);

// Accounts
const privateKeyHex = "0x6a7dfdf48155aa5d7654f392027e143d61dfe23ca2d9a8bbe7395192ffbd22d5";
const account = new accounts(privateKeyHex);

account.setWeb3(web3);
console.log(web3.eth.accounts.wallet[0].address);

class SynapseProvider {
    constructor(group, wei_rate, configFile = ".synapseprovider") {
        this.configFile = configFile;
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
            this.publish('test');
        }, 10000);
    }

    // Check whether or not we need to register, if so register
    checkForRegister(configFile, group, wei_rate, callback) {
        // Already regsitered
        if ( ConfigStorage.exists(configFile) ) {
            console.log("Loading configuration from", configFile);

            const data = JSON.parse(ConfigStorage.load(configFile));
            this.private_key = data.private_key;

            // Import a secp224r1 keypair
            this.keypair = new SharedCrypto.PublicKey(null, data.private_key);

            console.log("public key", this.keypair.getPublic());
            console.log("private key", this.keypair.getPrivate());

            // Load the subscriptions into internal objects
            this.subscriptions = data.subscribers.map(data => SynapseSubscription.fromObject(data));

            callback();
        }
        else {
             // Don't overflow a solidity bytes32
            if (group.length > 32) {
                throw new Error("Group size is greater than 32 in length!");
            }

            this.keypair = new SharedCrypto.PublicKey();
            const public_key = "0x" + this.keypair.getPublic();

            console.log("Created public key", public_key);

            // Make the request
            this.marketInstance.methods.registerSynapseProvider(web3.utils.fromUtf8(group), public_key, wei_rate).send({
                gas: 300000,
                from: web3.eth.accounts.wallet[0].address
            }, (err, result) => {
                if (err) {
                    throw err;
                }
                ConfigStorage.save(".synapseprovider", JSON.stringify({
                    private_key: this.keypair.getPrivate(),
                    subscriptions: []
                }));

                this.subscriptions = [];

                console.log("Created the provider!");

                callback();
            });
        }
    }

    // Wait for subscription events
    listenForEvent() {
        // Wait for events of SynapseDataPurchase type with a provider that is us
        SynapseMarket_listen.events.SynapseDataPurchase({
            filter: { provider: web3.eth.accounts.wallet[0].address }
        }, (err, result) => {
            // Ignore errors
            if ( err ) {
                throw err;
            }

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
            if ( err ) {
                throw err;
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

        // Calculate block length based off of wei rate
        const blocks = Math.floor(data.amount / this.wei_rate);

        // Get the subscriber's public key from the stream
        const subscriber_public = data.public_key.slice(2, -6);

        console.log("subscriber_public", subscriber_public);

        // Derive an EC key object
        const subscriber_public_ec = new SharedCrypto.PublicKey(subscriber_public, null);

        // Calculate the secret key
        const secret = this.keypair.generateSecret(subscriber_public_ec);
        console.log("secret", secret);

        // Get the nonce
        const noncehex = data.nonce.substring(2);
        const nonce = Buffer.from(noncehex.slice(0, 32), "hex");

        // Get the UUID
        console.log("encrypted uuid", data.encrypted_uuid);
        const cipher_text = data.encrypted_uuid.substring(2);

        console.log("nonce", nonce);

        // Create the decipher object
        const cipher = crypto.createDecipheriv('aes-256-ctr', secret, nonce);
        // cipher.setAutoPadding(true);

        // Add it to the decipher stream and decrypt to String
        const raw_uuid = Buffer.concat([(cipher.update(new Buffer(cipher_text, 'hex')), cipher.final())]);
        const uuid = raw_uuid.toString('base64');

        console.log("raw_uuid", raw_uuid);
        console.log("Starting subscription with", data.subscriber, "on", uuid);

        // Create an internal subscription object and begin it
        this.subscriptions.push(new SynapseSubscription(
            data.subscriber,
            secret,
            nonce,
            blocknumber + blocks + 1, // End block is the last block + 1
            uuid
        ));

        this.save();
    }

    // Publish data to the subscribers
    publish(data) {
        console.log("Publishing to", this.subscriptions.length, "subscriptions");
        this.subscriptions.forEach(subscription => {
            subscription.publish(data);
        });
    }

    // Save the necessary data into the ~/.synapseprovider field
    save() {
        // Save private key and the serialized subscribers
        ConfigStorage.save(this.configFile, JSON.stringify({
            private_key: this.keypair.getPrivate(),
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

const provider = new SynapseProvider(process.argv[2], 1);
//provider.on('ready', () => {})



module.exports = SynapseProvider;
