const crypto = require('crypto');
const IPFS = require('ipfs');
const Room = require('ipfs-pubsub-room');

// Establish an IPFS connection with pubsub enabled
const ipfs = new IPFS({
    repo: 'ipfs/synapse-test/1',
    EXPERIMENTAL: {
        pubsub: true
    }
});

class SynapseSubscription {
    constructor(address, secret, nonce, endblock, uuid) {
        this.address = address;
        this.secret = secret;
        this.nonce = nonce;
        this.room = Room(ipfs, 'synapse-' + uuid)

        if ( secret && nonce ) {
            // Create a cipher with the secret and nonce as buffers, not hex strings.
            this.cipher = crypto.createCipheriv('aes-256-ctr', secret, nonce);
            this.cipher.setAutoPadding(true);

            this.decryptCipher = crypto.createDecipheriv('aes-256-ctr', secret, nonce);
        }

        this.endblock = endblock;
        this.uuid = uuid;
    }

    // Publish data for this feed
    publish(data) {
        // Encrypt the stringified data and output to a Buffer
        let pubdata;

        if ( this.cipher ) {
            pubdata = this.cipher.update(JSON.stringify(data));
        }
        else {
            pubdata = new Buffer(JSON.stringify(data));
        }

        console.log(pubdata);
    
        // Publish to IPFS channel of UUID
        this.room.broadcast(pubdata);
    }

    // Subscribe to the data from this feed
    data(callback) {
        // Subscribe to the data
        this.room.on('message', (err, data) => {
            // Decrypt the data
            let output = data['data'];

            if ( this.decryptCipher ) {
                output = this.decryptCipher.update(output);
            }

            callback(decrypted);
        });
    }

    // Serialize object for saving
    toObject() {
        return {
            address: this.address,
            secret: this.secret,
            nonce: this.nonce,
            endblock: this.endblock,
            uuid: this.uuid
        };
    }

    // Establish from serialized object for loading
    static fromObject(data) {
        return new SynapseSubscription(
            data.address,
            data.secret,
            data.nonce,
            data.endblock,
            data.uuid
        );
    }
}

module.exports = SynapseSubscription;
