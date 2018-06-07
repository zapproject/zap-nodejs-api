// web3 interface
const Web3 = require('web3');
// import server and provider for our test environment
const { provider } = require('ganache-core');
// import method that will deploy our contracts
const migrate = require('../node_modules/truffle-core/lib/commands/migrate');
// method that helps to resolve paths 
const path = require('path');

// method that helps as get promise with out callback function
const { serverOptions, server } = require('./server');

const { promisify } = require('util');
const asyncMigrate = promisify(migrate.run);
const {
    ganacheNetwork,
    contractsBuildDirectory,
    contractsDirectory,
    migrationsDirectory,
    workingDirectory,
    protocol
} = require('../config');

// initiate and run ganache server;
const webProvider = new Web3();
const ganacheProvider = provider(serverOptions);
const ganacheServer = server;

//connect our provider with ganache-core
webProvider.setProvider(ganacheProvider);

function getNetworkPort(network) {
    return network.address.split(':')[2];
}

function getNetworkHostname(network) {
    return network.address.split(':')[1].slice(2);
}

async function migrateContracts() {
    const options = {
        logger: console,
        contracts_build_directory: path.join(__dirname, contractsBuildDirectory),
        contracts_directory: path.join(__dirname, contractsDirectory),
        working_directory: path.join(__dirname, workingDirectory),
        migrations_directory: path.join(__dirname, migrationsDirectory),
        network: 'ganache-gui',
        provider: ganacheProvider,
        network_id: ganacheNetwork.id,
        hostname: getNetworkPort(ganacheNetwork),
        port: getNetworkHostname(ganacheNetwork).toString(),
        gas: "6721975",
        gasPrice: "10000000"
    };
    try {
        await asyncMigrate(options);
        return Promise.resolve('done');
    } catch(err) {
        throw err;
    }
}

module.exports = {
    migrateContracts,
    ganacheProvider,
    ganacheServer,
    webProvider
};

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .should();
/*require('./tests/zapTokenTest');*/
require('./tests/zapRegistryTest');
/*require('./tests/zapBondageTest');
require('./tests/zapArbiterTest');
require('./tests/zapDispatchTest');*/
/*require('./tests/closeServer');*/
