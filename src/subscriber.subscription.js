const crypto = require('crypto');
const IPFS = require('ipfs');

// Establish an IPFS connection with pubsub enabled
const ipfs = new IPFS({
    repo: 'ipfs/synapse-test/1',
    EXPERIMENTAL: {
        pubsub: true
    },
    config:{
        Addresses:{
            Swarm:[
                "/ip4/127.0.0.1/tcp/4002",
                
            ]
        }
    }
});

ipfs.on("ready",()=>{
    ipfs.swarm.connect("/ip4/34.193.100.223/tcp/4003/ws/ipfs/QmPaPM5wSb8tbiomvALxywVSEWUYa6uZh44ZCQYN3uPMnH", (err) => {
        if (err) throw err;

        ipfs.swarm.peers({}, function (err, peers) {
            console.log("peers", peers)
        })
    })
})

class SynapseSubscription {
    constructor(address, secret, nonce, endblock, uuid) {
        this.address = address;
        this.secret = secret;
        this.nonce = nonce;

        // Create a cipher with the secret and nonce as buffers, not hex strings.
        this.cipher = crypto.createDecipheriv('aes-256-ctr', secret, nonce);

        this.endblock = endblock;
        this.uuid = uuid;
    }

    // Publish data for this feed
    publish(data) {
        // Encrypt the stringified data and output to a Buffer
        const pubdata = this.cipher.update(JSON.stringify(data)) +
                        this.cipher.final();

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
        ipfs.pubsub.subscribe(this.uuid, (data) => {
            // Decrypt the data
	    const decrypted = this.cipher.update(data.data).toString();
            callback(decrypted);
        }, (err)=>{
	    callback(err);
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
