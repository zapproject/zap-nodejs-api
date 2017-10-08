const crypto = require('crypto');
const IPFS = require('ipfs');
const Room = require('ipfs-pubsub-room');

// Establish an IPFS connection with pubsub enabled
let additionalConfig = {
    "Bootstrap": [
        "/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
        "/ip4/104.236.151.122/tcp/4001/ipfs/QmSoLju6m7xTh3DuokvT3886QRYqxAzb1kShaanJgW36yx",
        "/ip4/104.236.176.52/tcp/4001/ipfs/QmSoLnSGccFuZQJzRadHn95W2CrSFmZuTdDWP8HXaHca9z",
        "/ip4/104.236.179.241/tcp/4001/ipfs/QmSoLpPVmHKQ4XTPdz8tjDFgdeRFkpV8JgYq8JVJ69RrZm",
        "/ip4/104.236.76.40/tcp/4001/ipfs/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64",
        "/ip4/128.199.219.111/tcp/4001/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu",
        "/ip4/162.243.248.213/tcp/4001/ipfs/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm",
        "/ip4/178.62.158.247/tcp/4001/ipfs/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd",
        "/ip4/178.62.61.185/tcp/4001/ipfs/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3"
    ]
};

if ( typeof window != 'undefined' ) {
    console.log("Adding additional configuration settings for the web...");
    
    additionalConfig["Addresses"] = {
        "Swarm": [
            "/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star"
        ],
        "API": '',
        "Gateway": ''
    }
}

const ipfs = new IPFS({
    repo: 'ipfs/synapse-test/1',
    config: additionalConfig,
    EXPERIMENTAL: {
        pubsub: true
    }
});

class SynapseSubscription {
    constructor(address, secret, nonce, endblock, uuid) {
        this.address = address;
        this.secret = secret;
        this.nonce = nonce;
        this.room = Room(ipfs, 'synapse-' + uuid);

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

            console.log(output);

            callback(decrypted);
        });
    }

    // Serialize object for saving
    toObject() {
        return {
            address: this.address,
            secret: this.secret.toString('hex'),
            nonce: this.nonce.toString('hex'),
            endblock: this.endblock,
            uuid: this.uuid
        };
    }

    // Establish from serialized object for loading
    static fromObject(data) {
        return new SynapseSubscription(
            data.address,
            new Buffer(data.secret, 'hex'),
            new Buffer(data.nonce, 'hex'),
            data.endblock,
            data.uuid
        );
    }
}

module.exports = SynapseSubscription;
