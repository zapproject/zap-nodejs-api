const {
    endpoint,
    port,
} = require('./config');

module.exports = {
    networks: {
        testSdk: {
            host: endpoint,
            port: port,
            network_id: "*"
        }
    }
};