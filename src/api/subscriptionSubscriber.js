const crypto = require('crypto');
const IPFS = require('ipfs');
const Room = require('ipfs-pubsub-room');

// Establish an IPFS connection with pubsub enabled
const ipfs = new IPFS({
    repo: 'ipfs/synapse-test/2',
    start: true,
    init: true,
    config: {
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
        ],
        "Addresses": {
            "Swarm": [
                "/ip4/127.0.0.1/tcp/1337/ws"
                // "/dns4/star-signal.cloud.ipfs.team/wss/p2p-webrtc-star"
            ],
            "API": '',
            "Gateway": ''
        }
    },
    EXPERIMENTAL: {
        pubsub: true
    }
});

ipfs.on("ready", () => {

    ipfs.swarm.connect("/ip4/127.0.0.1/tcp/4003/ws/ipfs/QmSmwDi3AmMm3pFbyvzmRZ3FfLtNAtYv5ie7ispER1kGUB", (err) => {
        if (err) console.log("======= crucial error ========", err);

        ipfs.swarm.peers({}, function(err, peers) {
            console.log("peers", peers);
        });

    });
    // // we are setting this interval, so that subscirber could find provder again without restarting, once provider restarts
    // setInterval(() => {
    //     ipfs.swarm.connect("/ip4/127.0.0.1/tcp/4003/ws/ipfs/QmT9xvwLVR1GbHKj83YWcrZnrxo4bJ9cQ4jb35QcrSeSJA", (err) => {
    //         if (err) console.log("======= crucial error ========", err);
    //
    //         ipfs.swarm.peers({}, function(err, peers) {
    //             console.log("peers", peers[0].addr);
    //         });
    //     });
    //
    // }, 30000);

});

class ZapSubscription {
    constructor(address, secret, nonce, endblock, uuid) {
        this.address = address;
        this.secret = secret;
        this.nonce = nonce;
        console.log('synapse-', uuid);
        this.room = Room(ipfs, 'synapse-' + uuid);

        if (secret && nonce) {
            // Create a cipher with the secret and nonce as buffers, not hex strings.
            this.cipher = crypto.createCipheriv('aes-256-ctr', secret, nonce);
            this.cipher.setAutoPadding(true);

            this.decipher = crypto.createDecipheriv('aes-256-ctr', secret, nonce);
        }

        this.endblock = endblock;
        this.uuid = uuid;
    }

    // Publish data for this feed
    publish(data) {
        // Encrypt the stringified data and output to a Buffer
        let pubdata;

        if (this.cipher) {
            pubdata = this.cipher.update(JSON.stringify(data));
        } else {
            pubdata = Buffer.from(JSON.stringify(data));
        }

        //console.log(pubdata);

        // Publish to IPFS channel of UUID
        this.room.broadcast(pubdata);
    }

    // Subscribe to the data from this feed
    data(callback) {
        // Subscribe to the data
        this.room.on('message', (data) => {
            console.log("Received message", data);

            if (!data) {
                return;
            }

            // Decrypt the data
            let output = data['data'];

            if (this.decipher) {
                output = this.decipher.update(output);
            }

            console.log(output);

            callback(output.toString('utf8'));
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
        return new ZapSubscription(
            data.address,
            Buffer.from(data.secret, 'hex'),
            Buffer.from(data.nonce, 'hex'),
            data.endblock,
            data.uuid
        );
    }
}

module.exports = ZapSubscription;
