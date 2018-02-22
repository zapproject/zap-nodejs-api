const { readFileSync } = require('fs');

module.exports = class Wrapper {
    constructor(eth) {
        this.eth = eth;
    }

    initClass({ instanceClass, address, abiPath}) {
        let abiFile;
        if (typeof abiPath === 'object') {
            abiFile = abiPath;
        } else {
            abiFile = JSON.parse(readFileSync(abiPath));
        }
        return new instanceClass({
            eth: this.eth, 
            contract_address: address,
            abiFile
        });
    }
};
