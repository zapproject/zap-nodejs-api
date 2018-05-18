const crypto = require('crypto');
const ZapCrypto = require('../../util/ZapCrypto.js');
const ZapHandler = require('../components/Handler.js');
const ZapIPFSSubscription = require('./ZapIPFSSubscription.js');

class ZapIPFSHandler extends ZapHandler {
    constructor(keypair) {
        super();
        this.keypair = keypair;
    }

    // Generate paremeters to initiate a smart contract
    initiateSubscription(oracle) {
        // Do the key exchange
        const provider_public_ec = new ZapCrypto.PublicKey(oracle.public_key, null);
        const secret = this.keypair.generateSecret(provider_public_ec);

        // Generate a nonce
        const nonce = new Buffer(crypto.randomBytes(16));
        const nonce_hex = "0x" + nonce.toString('hex');

        // Generate a UUID
        const raw_uuid = crypto.randomBytes(32);
        const uuid = raw_uuid.toString('base64');

        // Setup the cipher object with the secret and nonce
        const cipher = crypto.createCipheriv('aes-256-ctr', secret, nonce);
        cipher.setAutoPadding(true);

        // Encrypt it (output is buffer)
        const euuid = Buffer.concat([cipher.update(raw_uuid), cipher.final()]);

        // Sanity check
        if (euuid.length != 32) {
            throw new Error("encrypted uuid is an invalid length");
        }

        // Hexify the euuid
        const euuid_hex = "0x" + new Buffer(euuid, 'ascii').toString('hex');

        return [nonce_hex, euuid_hex];
    }

    // Override the listen to decrypt IPFS related data
    handleSubscription(event) {
        const args = event.params;

        // Sanity check on the arguments
        if ( args.length != 2 ) {
            return new Error("Got invalid arguments from a subscription event");
        }

        // Surround with try/catch in case of decryption error
        try {
            // Get the subscriber's public key from the stream
            const subscriber_public = event.public_key.slice(2, -6);

            // Derive an EC key object
            const subscriber_public_ec = new ZapCrypto.PublicKey(subscriber_public, null);

            // Calculate the secret key
            const secret = this.keypair.generateSecret(subscriber_public_ec);

            // Get the nonce
            const nonce_hex = args[0].substring(2, 2 + 32);
            const nonce = Buffer.from(nonce_hex, "hex");

            // Create the decipher object
            const decipher = crypto.createDecipheriv('aes-256-ctr', secret, nonce);

            // Get the encrypted UUID
            const cipher_text = args[1].substring(2);

            // Add it to the decipher stream and decrypt to base64 string
            const raw_uuid = Buffer.concat([decipher.update(cipher_text, 'hex'), decipher.final()]);
            const uuid = raw_uuid.toString('base64');

            return new ZapIPFSSubscription(
                event.subscriber,
                secret,
                nonce,
                event.endblock,
                uuid
            );
        }
        catch (err) {
            return err;
        }
    }
}

module.exports = ZapIPFSHandler;
