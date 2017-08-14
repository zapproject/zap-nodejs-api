const crypto = require('crypto');
const bson = require('bson');
const Elliptic = require('elliptic');
const IPFS = require('ipfs');
const MerkleTree = require('./merkle');
const Web3 = require('web3');

// Wrapper for sha256
function sha256(item) {
    const hash = crypto.createHash("sha256");
    hash.update(item);
    return hash.digest();
}

// Load the web3 instance
const web3 = new Web3();

// Load the SynapseMarket ABI
const SynapseMarket = web3.eth.contract("../../build/src_market_contracts_Market_sol_SynapseMarket.abi");

// Connect to IPFS
const ipfs = new IPFS({
    repo: 'ipfs/synapse-test/1',
    EXPERIMENTAL: {
        pubsub: true
    }
});

// Load secp224k1
const ec = Elliptic.ec('secp224k1');

// Different payment levels
const SynapseIQLevelLow = 5;
const SynapseIQLevelMed = 10;
const SynapseIQLevelHigh = 15;

// Size of the pool for oraclization events
const SynapseMaxPool = 500;

// Parse a timestamp into a nice string
function dateString(timestamp) {
    const obj = new Date(timestamp);
    return `${obj.getMonth() + 1}-${obj.getDate()}-${obj.getFullYear()}`;
}

class SynapseOraclizer {
    constructor(marketAddress, storageFolder = "~/.synapseoracle/") {
        this.storageFoldre = storageFolder;
        this.marketInstance = SynapseMarket.at(marketAddress);

        // For now we're going to store the data in memory, in the future this
        // can be stored in redis or mongodb or something
        this.pool = {
            low: [],
            med: [],
            high: []
        };

        // Time that the data was started to be collected. When this moves to
        // long term storage then this will need to be stored there.
        this.start = Date.now();

        // Wait for events from IPFS
        this.listenForEvents();
    }

    // Wait for events on the IPFS channel
    listenForEvents() {
        // Wait for data on synapse-oracle
        ipfs.pubsub.subscribe("synapse-oracle", (err, result) => {
            if ( err ) {
                throw err;
            }

            let data;

            // {
            //     index: 0, <- index in the market
            //     data: '', <- data
            //     sig: ''   <- signature of data
            // }

            // Parse JSON data
            try {
                data = JSON.parse(result['data']);
            }
            catch (err) {
                return;
            }

            // Get provider info
            const address = this.marketInstance.getProviderAddress(data.index);
            const public_key = this.marketInstance.getProviderPublic(data.index);

            // Verify the signature
            const key = ec.keyFromPublic(public_key.toString('hex'), 'hex');

            // Calculate the message hash
            const msgHash = sha256(data['data']);

            // Verify the signature
            if ( !key.verify(msgHash, data['signature']) ) {
                return;
            }

            // Find how much IQ is in the market contract
            const iq = this.marketInstance.getPaidIQ(address);

            // Calculate the level
            const level = iq / 5; // TODO - not this

            if ( level == SynapseIQLevelLow ) {
                this.pool['low'].push(data['data']);
            }
            else if ( level == SynapseIQLevelMed ) {
                this.pool['mid'].push(data['data']);
            }
            else if ( level == SynapseIQLevelHigh ) {
                this.pool['high'].push(data['data']);
            }

            this.checkPools();
        });
    }

    // Check to see if the pools are ready to be delt with
    checkPools() {
        // Get the size of all the pools
        const poolSize = this.pool.low.length +
                         this.pool.med.length +
                         this.pool.high.length;

        // Make sure we have enough for an oraclization event
        if ( poolSize < SynapseMaxPool ) {
            return;
        }

        // Create MerkleTree objects for each level
        const highMerkle = new MerkleTree();
        const medMerkle = new MerkleTree();
        const lowMerkle = new MerkleTree();

        // Create a level for each
        for ( const item of this.pool.low ) {
            lowMerkle.addItem(item);
        }

        for ( const item of this.pool.med ) {
            medMerkle.addItem(item);
        }

        for ( const item of this.pool.high ) {
            highMerkle.addItem(item);
        }

        // Construct the merkle trees
        const highMerkleTree = highMerkle.constructTree();
        const midMerkleTree = midMerkleTree.constructTree();
        const lowMerkleTree = lowMerkleTree.constructTree();

        // Store them
        const storageDir = this.storageFolder + "/merkle/";

        // File locations for individual levels
        const highFile = storageDir + "high-" + dateString(this.start);
        const midFile = storageDir + "mid-" + dateString(this.start);
        const lowFile = storageDir + "low-" + dateString(this.start);

        // Post the files to IPFS
        ipfs.files.add([
            {
                path: highFile,
                content: bson.serialize({
                    root: highMerkleTree,
                    items: this.pool.high
                })
            },
            {
                path: midFile,
                content: bson.serialize({
                    root: midMerkleTree,
                    items: this.pool.mid
                })
            },
            {
                path: lowFile,
                content: bson.serialize({
                    root: lowMerkleTree,
                    items: this.pool.low
                })
            },

        ], (err, files) => {
            // Find the individual hashes
            let lowHash  = "";
            let midHash  = "";
            let highHash = "";

            // Load them from the IPFS results
            for ( const file of files ) {
                if ( file.path == highFile ) {
                    highHash = file.hash;
                }
                else if ( file.path == midFile ) {
                    midHash = file.hash;
                }
                else if ( file.path == lowFile ) {
                    lowHash = file.hash;
                }
            }

            // TODO - send to the oracle contract
        });
    }
}

module.exports = SynapseOraclizer;
