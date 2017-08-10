const crypto = require('crypto');

function sha256(item) {
    const hash = crypto.createHash("sha256");
    hash.update(item);
    return hash.digest();
}

// Wrapper class for a merkle tree
class MerkleTree {
    constructor() {
        this.items = [];
        this.tree = {};
    }

    // Add an item to be merkled
    addItem(item) {
        this.items.push(item);
    }

    // Construct a merkle tree from the current data
    // The output will be as follows:
    // {
    //     root: buffer of the root hash
    //     layers: an array of each layer of the merkle tree, where each layer
    //     is an array of hash values
    // }
    constructTree(items = undefined, layers = []) {
        // If theres no more items left to be hashed, the root has been produced
        if ( items.length == 1 ) {
            return {
                root: items[0],
                layers: layers
            };
        }

        // If we haven't recursed yet, do the initial hashing of the data
        if ( items === undefined ) {
            // Make a temporary copy of the data
            const tmp = this.items.slice();
            items = [];

            // Hash each one into items
            for ( const item of tmp ) {
                items.push(sha256(item));
            }
        }

        // Prepare a layer
        const layer = [];

        // While theres any data left in the current layer
        while ( items.length > 0 ) {
            // Pop 2 items, defaulting to empty string if we OBO
            const a = items.shift() || "";
            const b = items.shift() || "";

            // Push the hash of the two onto the layer
            layer.push(sha256(a + b));
        }

        // Add the finishd layer to the layers list
        layers.push(layer);

        // Recurse with the new data
        return this.constructTree(layer, layers);
    }
}

module.exports = MerkleTree;
