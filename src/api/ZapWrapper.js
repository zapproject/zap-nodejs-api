module.exports = class Wrapper {
    constructor(data) {
        this.class = data.class;
        this.eth = data.eth;
        this.address = data.address;
    }

    initClass() {
        return new this.class({
            eth: this.eth, 
            contract_address: this.address
        });
    }
};
