const Web3 = require('web3');
const IPFS = require('ipfs');
const fs = require('fs');
const crypto = require('crypto');

const SynapseMarket = web3.eth.contract("../../build/src_market_contracts_Market_sol_SynapseMarket.abi");

// Establish an IPFS connection with pubsub enabled
const ipfs = new IPFS({
    EXPERIMENTAL: {
        pubsub: true
    }
});

const web3 = new Web3();

class SynapseInternalSubscription {
    constructor(subscriber, secret, nonce, endblock, uuid) {
        this.subscriber = subscriber;
        this.secret = secret;
        this.nonce = nonce;

        // Create a cipher with the secret and nonce as buffers, not hex strings.
        this.cipher = crypto.createCipheriv('aes-256-ctr', new Buffer(secret, 16),
                                                           new Buffer(nonce, 16));

        this.endblock = endblock;
        this.uuid = uuid;
    }

    // Publish data for this feed
    publish(data) {
        // Encrypt the stringified data and output to a Buffer
        const pubdata = this.cipher.update(JSON.stringify(data))
                                   .final();

        // Publish to IPFS channel of UUID
        ipfs.pubsub.publish(this.uuid, pubdata, (err) => {
            if ( err ) {
                throw err;
            }
        });
    }

    // Serialize object for saving
    toObject() {
        return {
            subscriber: this.subscriber,
            secret: this.secret,
            nonce: this.nonce,
            endblock: this.endblock,
            uuid: this.uuid
        };
    }

    // Establish from serialized object for loading
    static fromObject(data) {
        return new SynapseInternalSubscription(
            data.subscriber,
            data.secret,
            data.nonce,
            data.endblock,
            data.uuid
        );
    }
}

class SynaspeProvider {
    constructor(marketAddress, group, wei_rate, configFile = "~/.synapseprovider") {
        this.group = group;
        this.marketInstance = SynapseMarket.at(marketAddress);

        this.checkForRegister(configFile, group, wei_rate, () => {
            this.listenForEvent();
            this.listenForBlocks();
            this.listenForTerms();
            this.loadSubscriptions();
        });
    }

    // Check whether or not we need to register, if so register
    checkForRegister(configFile, group, wei_rate, callback) {
        // Already regsitered
        if ( fs.existsSync(configFile) ) {
            const data = JSON.parse(fs.readFileSync(configFile));

            this.private_key = data.private_key;

            // Generate a secp256k1 keypair
            this.keypair = crypto.createECDH('secp224k1');
            this.keypair.setPrivateKey(data.private_key, 'hex');

            // Load the subscriptions into internal objects
            this.subscriptions = data.subscriptions.map(data => SynapseInternalSubscription.fromObject(data));

            callback();
            return;
        }

        // Don't overflow a solidity bytes32
        if ( group.length > 32 ) {
            throw new Error("Group size is greater than 32 in length!");
            return;
        }

        this.keypair = crypto.createECDH('secp224k1');
        const public_key = "0x" + keypair.generateKeys('hex', 'compressed');

        // Make the request
        this.marketInstance.requestSynapseProvider(web3.utils.fromUtf8(group), public_key, wei_rate, {
            gas: 300000 // TODO - not this
        }, (err, result) => {
            if ( err ) {
                throw error;
            }

            console.log("Successfully registered");

            fs.writeFileSync("~/.synapseprovider", JSON.stringify({
                private_key: keypair.getPrivateKey('hex'),
                subscriptions: []
            }));

            this.subscriptions = [];

            callback();
        });
    }

    // Wait for subscription events
    listenForEvent() {
        // Wait for events of SynapseDataPurchase type with a provider that is us
        this.marketInstance.SynapseDataPurchase([
            { provider: web3.eth.accounts[0] }
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
        const filter = web3.eth.filter('latest');

        filter.watch((err, result) => {
            const block = web3.eth.getBlock(res, true);
            const blocknum = block.number;

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
        this.marketInstance.SynapseDataSubscriptionEnd([
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
            this.subscriptions = this.subscriptions.filter(subscription => subscription.subscriber == result.args.subscriber);
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
                   + cipher.final('utf8');

        console.log("Starting subscription with", data.subscriber, "on", uuid);

        // Create an internal subscription object and begin it
        this.subscriptions.push(new SynapseInternalSubscription(
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
        }))
    }

    // End a subscription
    terminateSubscription(subscription) {
        // group
        // provider_address
        // subscriber_address

        this.marketInstance.endSynapseSubscription_Provider(this.group, subscription.address, {
            gas: 300000 // TODO - not this
        }, (err, result) => {
            if ( err ) {
                throw err;
            }

            console.log("Ended subscription with", subscription);
        });
    }
}

module.exports = SynapseProvider;
