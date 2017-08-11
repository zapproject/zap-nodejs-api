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
    constructTree(items = undefined) {
        // If theres no more items left to be hashed, the root has been produced
        if ( items && items.length == 1 ) {
            const layer = items[0];
            layer.hash = layer.hash.toString('hex');
            return layer;
        }

        // If we haven't recursed yet, do the initial hashing of the data
        if ( items === undefined ) {
            // Make a temporary copy of the data
            const tmp = this.items.slice();
            items = [];

            // Hash each one into items
            for ( const item of tmp ) {
                items.push({
                    hash: sha256(item)
                });
            }
        }

        // Prepare a layer
        const layer = [];

        // While theres any data left in the current layer
        while ( items.length > 0 ) {
            // Pop 2 items, defaulting to empty string if we OBO
            const a = items.shift();
            const b = items.shift() || { hash: sha256("") };

            a.hash = a.hash.toString('hex');
            b.hash = b.hash.toString('hex');

            // Construct the merkle node
            const obj = {
                hash: sha256(a.hash + b.hash),
                a: a,
                b: b
            };

            // Push the hash of the two onto the layer
            layer.push(obj);
        }

        // Recurse with the new data
        return this.constructTree(layer);
    }

    // Verify a merkle tree
    verifyTree(tree) {
        // We're at a leaf, theres nothing to verify, so it's good.
        if ( tree.a == undefined || tree.b == undefined ) {
            return true;
        }

        // Verify the merkle tree
        if ( tree.hash != sha256(tree.a.hash + tree.b.hash).toString('hex') ) {
            return false;
        }

        // Verify it's sub-nodes
        if ( !this.verifyTree(tree.a) || !this.verifyTree(tree.b) ) {
            return false;
        }

        // If it's ok!
        return true;
    }
}

module.exports = MerkleTree;
