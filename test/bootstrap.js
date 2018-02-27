// web3 interface
const Web3 = require('web3');
// import server and provider for our test environment
const { provider } = require('ganache-core');
// import method that will deploy our contracts
const migrate = require('../node_modules/truffle-core/lib/commands/migrate');
// method that helps to resolve paths 
const path = require('path');
// method that helps as get promise with out callback function
const { serverOptions } = require('../config/server.js');

const { networks } = require('../truffle.js');
const { promisify } = require('util');
const asyncMigrate = promisify(migrate.run);
const {
    endpoint,
    port,
    network,
    contractsBuildDirectory,
    contractsDirectory,
    network_id,
    migrationsDirectory,
} = require('../config');
// initiate and run ganache server;

const webProvider = new Web3();
const ganacheProvider = provider(serverOptions);
//connect our provider with ganache-core
webProvider.setProvider(ganacheProvider);

process.on('unhandledRejection', (reason, p) => {
    // console.log( //eslint-disable-line
    //     `Unhandled Rejection at: Promise', ${p}, 
    //     'reason:', ${reason}`
    // );
});

async function migrateContracts() {
    const options = {
        // logger: console,
        "contracts_build_directory": path.join(__dirname, contractsBuildDirectory),
        "contracts_directory": path.join(__dirname, contractsDirectory),
        network: network,
        networks,
        provider: ganacheProvider,
        "migrations_directory": path.join(__dirname, migrationsDirectory),
        "network_id":network_id,
        "hostname":endpoint,
        "port":port,
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
    webProvider
};

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber'))
    .should();
require('./tests/zapTokenTest');
require('./tests/zapRegistryTest');
require('./tests/closeServer');
