// web3 interface
const Web3 = require('web3');
// import server and provider for our test environment
const { provider } = require('ganache-core');
// import method that will deploy our contracts
const migrate = require('../node_modules/truffle-core/lib/commands/migrate');
// method that helps to resolve paths 
const path = require('path');
// method that helps as get promise with out callback function
const contract = require('truffle-contract');
const { serverOptions } = require('../config/server.js');

// get instance of our ganache serve
const server = require('./server');

// const  access = fs.createWriteStream(__dirname + '/node.access.log', { flags: 'a' });
// const  error = fs.createWriteStream(__dirname + '/node.error.log', { flags: 'a' });

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
    zapTokenAbi
} = require('../config');
// initiate and run ganache server;

const webProvider = new Web3();
const ganacheProvider = provider(serverOptions);
//connect our provider with ganache-core
webProvider.setProvider(ganacheProvider);

async function migrateContracts() {
    const options = {
        logger: console,
        "contracts_build_directory": path.join(__dirname, contractsBuildDirectory),
        "contracts_directory": path.join(__dirname, contractsDirectory),
        network: network,
        networks,
        provider: ganacheProvider,
        dryRun: true,
        "migrations_directory": path.join(__dirname, migrationsDirectory),
        "network_id":network_id,
        "hostname":endpoint,
        "port":port,
    };
    try {
        await asyncMigrate(options);
        const abiJSON = require(path.join(__dirname, zapTokenAbi));
        const zapToken = contract(abiJSON);
        zapToken.setProvider(ganacheProvider);
        const deplZapToken = await zapToken.deployed();
        const accounts = await webProvider.eth.getAccounts();
        const data = await deplZapToken.mint(deplZapToken.address, 140000, {from: accounts[0]});
        const balance = await deplZapToken.balanceOf(deplZapToken.address);
        console.log(balance.toString());
    } catch(err) {
        console.log('errrrrr=====?>>>>>>',err);
        throw err;
    } finally {
        closeServer();
    }
}

migrateContracts()
    .then(() => {})
    .catch(() => {});

function closeServer() {
    server.close();
}
require('chai').should();
