const crypto = require('crypto');
const IPFS = require('ipfs');

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

        // Create a cipher with the secret and nonce as buffers, not hex strings.
        this.cipher = crypto.createCipheriv('aes-256-ctr', secret, nonce);
        this.decryptCipher = crypto.createDecipheriv('aes-256-ctr', secret, nonce);

	this.cipher.setAutoPadding(true)
        this.endblock = endblock;
        this.uuid = uuid;
    }

    // Publish data for this feed
    publish(data) {
        // Encrypt the stringified data and output to a Buffer
        
        const pubdata = this.cipher.update(JSON.stringify(data));
	console.log(pubdata);
	
	//TEST
	//const decrypted = this.decryptCipher.update(pubdata);	

        // Publish to IPFS channel of UUID
        ipfs.pubsub.publish(this.uuid, pubdata, (err) => {
            if ( err ) {
                throw err;
            }
        });
    }

    // Subscribe to the data from this feed
    data(callback) {
        // Subscribe to the data
        ipfs.pubsub.subscribe(this.uuid, (err, data) => {
            // Decrypt the data
            const decrypted = this.cipher.update(data['data']) +
                              this.cipher.final();

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
