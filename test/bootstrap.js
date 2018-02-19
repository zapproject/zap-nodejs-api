// web3 interface
const Web3 = require('web3');
// import server and provider for our test environment
const { provider, server } = require('ganache-cli');
// import method that will deploy our contracts
const migrate = require('../node_modules/truffle-core/lib/commands/migrate');
// method that helps to resolve paths 
const path = require('path');
// method that helps as get promise with out callback function
const contract = require('truffle-contract');

const { promisify } = require('util');
const asyncMigrate = promisify(migrate.run);

const {
    endpoint,
    port,
    protocol,
    network,
    zaRegistryPath: abiPath,
    contractsBuildDirectory,
    contractsDirectory
} = require('../config');
// initiate and run ganache server;
var ganacheServer = server();

ganacheServer.listen(port, function (err, data) {
    console.log(err);
    console.log(data);
});
const abiJSON = require(path.join(__dirname, abiPath));
const webProvider = new Web3(new Web3.providers.HttpProvider(`${protocol}${endpoint}:${port}`));
const launchProvider = provider();


webProvider.setProvider(launchProvider);
const zapToken = contract({ abi: abiJSON });
zapToken.setProvider(webProvider);

let accounts = [];
webProvider.eth.getAccounts()
    .then(data => accounts = data)
    .catch(err => console.log('webProvider', err));

async function migrateContracts() {
    const options = {
        logger: console,
        "contracts_build_directory": path.join(__dirname, contractsBuildDirectory),
        "contracts_directory": path.join(__dirname, contractsDirectory),
        network: network,
        provider: launchProvider
    };
    try {
        const data = await asyncMigrate(options);
        console.log(data);
    } catch(err) {
        console.log(err);
        throw err;
    }
}

migrateContracts()
    .then(data => console.log(data))
    .catch(err => console.log(err));
require('chai').should();
