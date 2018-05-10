const { readFileSync } = require('fs');

const getABI = (contractName) => {
    let abiPath = `../../contracts/abis/${contractName}.json`
    let abiFile = JSON.parse(readFileSync(abiPath));
    return abiFile;
}

const getAddress = (contractName, network, contractAddress) => {
    let address = contractAddress || JSON.parse("../contracts/${network}/addresses.json")[contractName];
    return address;
}

const toHex = (str) => {
    let hex = '';
    for(let i=0;i<str.length;i++) {
        hex += ''+str.charCodeAt(i).toString(16);
    }
    return `0x${hex}`;
};

const getHexBuffer = (specifier) => new Buffer(specifier, 'hex');

const getHexString = (str) => {
    const data = new Buffer(str);
    console.log(data.byteLength)
    const hex = data.toString('hex');
    return `0x${hex}`;
};

module.exports = {
    getABI,
    toHex,
    getHexBuffer,
    getHexString
};