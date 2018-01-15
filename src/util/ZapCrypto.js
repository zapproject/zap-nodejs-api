const EC = require('elliptic').ec;
const P224 = new EC('p224');
const crypto = require('crypto');

function sha256(item) {
    const hash = crypto.createHash("sha256");
    hash.update(item);
    return hash.digest();
}

class PublicKey {
    constructor(public_hex, private_hex) {
        this.key = null;

        if ( private_hex ) {
            this.key = P224.keyFromPrivate(private_hex, 'hex');
        }
        else if ( public_hex ) {
            this.key = P224.keyFromPublic(public_hex, 'hex');
        }
        else {
            this.key = P224.genKeyPair();
        }
    }
    // Get the public key as hex
    getPublic() {
        return this.key.getPublic().encode('hex', true);
    }

    // Get the private key as hex
    getPrivate() {
        return this.key.getPrivate().toString(16);
    }

    // Do the key exchange
    generateSecret(public_key) {
        const shared = this.key.derive(public_key.key.getPublic());
        return sha256(shared.toString(16));
    }
}

module.exports = {
    PublicKey: PublicKey
};
