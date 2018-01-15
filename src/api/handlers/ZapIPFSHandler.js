const crypto = require('crypto');
const ZapCrypto = require('../../util/ZapCrypto.js');
const ZapHandler = require('../ZapHandler.js');
const ZapIPFSSubscription = require('./ZapIPFSSubscription.js');

class ZapIPFSHandler extends ZapHandler {
    constructor(keypair) {
        super();
        this.keypair = keypair;
    }

    // Override the listen to decrypt IPFS related data
    parseSubscription(event) {
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
