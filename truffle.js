const {
    endpoint,
    port,
    network_id
} = require('./config');

module.exports = {
    networks: {
        testSdk: {
            host: endpoint,
            port: port,
            network_id: network_id
        }
    }
};