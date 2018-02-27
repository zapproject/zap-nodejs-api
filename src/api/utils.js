const toHex = (str) => {
    let hex = '';
    for(let i=0;i<str.length;i++) {
        hex += ''+str.charCodeAt(i).toString(16);
    }
    return '0x' + hex;
};

const getHexBuffer = (specifier) => new Buffer(specifier, 'hex');

const getHexString = (str) => {
    const data = new Buffer(str);
    const hex = data.toString('hex');
    return `0x${hex}`;
};

module.exports = {
    toHex,
    getHexBuffer,
    getHexString
};