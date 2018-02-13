const { readFileSync } = require('fs');

module.exports = class Wrapper {
    constructor(data) {
        this.class = data.class;
        this.eth = data.eth;
        this.address = data.address;
        this.abiPath = data.abiPath;
    }

    initClass() {
        const abiFile = JSON.parse(readFileSync(this.abiPath));
        return new this.class({
            eth: this.eth, 
            contract_address: this.address,
            abiFile
        });
    }
};
