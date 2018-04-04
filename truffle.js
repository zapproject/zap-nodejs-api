// const {
//     endpoint,
//     port,
//     network_id
// } = require('./config');

module.exports = {
    networks: {
        testSdk: {
            host: '127.0.0.1',
            port: 7545,
            network_id: 5777,
            gas: "6721975",
            gasPrice: "10000000"
        }
    }
};
