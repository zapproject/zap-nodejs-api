const Web3 = require('web3');
const { provider, server } = require('ganache-cli');
const path = require('path');
const {
    endpoint,
    port,
    protocol,
    network
} = require('../config');
var ganacheServer = server();
ganacheServer.listen(port, function(err, data) {
    console.log(err);
    console.log(data);
});
const abiPath = '../src/contracts/abis/ZapRegistry.json';
const abiJSON = require(path.join(__dirname, abiPath));
const web3 = new Web3(new Web3.providers.HttpProvider(`${protocol}${endpoint}:${port}`));
const launchProvider = provider();
web3.setProvider(launchProvider);
const migrate = require('../node_modules/truffle-core/lib/commands/migrate');
const options = {
    logger: console,
    "contracts_build_directory": path.join(__dirname, '../ZapContracts'),
    "contracts_directory": path.join(__dirname, '../ZapContracts/contracts'),
    network: network,
    provider: launchProvider
};
migrate.run(options, (err, res) => {
    console.log('err',err);
    console.log('res',res);
});

require('chai').should();
