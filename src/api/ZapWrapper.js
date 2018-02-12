module.exports = class Wrapper {
    constructor(data) {
        this.class = data.class;
        this.eth = data.eth;
        this.address = data.address;
        this.abiPath = data.abiPath;
    }

    initClass() {
        return new this.class({
            eth: this.eth, 
            abiPath: this.abiPath, 
            contract_address: this.address
        });
    }
};
