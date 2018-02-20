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
const server = require('./server');

// const  access = fs.createWriteStream(__dirname + '/node.access.log', { flags: 'a' });
// const  error = fs.createWriteStream(__dirname + '/node.error.log', { flags: 'a' });

const { networks } = require('../truffle.js');
const { promisify } = require('util');
const asyncMigrate = promisify(migrate.run);

const {
    endpoint,
    port,
    protocol,
    network,
    contractsBuildDirectory,
    contractsDirectory,
    network_id
} = require('../config');
// initiate and run ganache server;

const serverOptions = {
    "hostname":"127.0.0.1",
    "mnemonic":"candy maple cake sugar pudding cream honey rich smooth crumble sweet treat",
    "network_id":5777,
    "port":7545,
    "total_accounts":10,
    "unlocked_accounts":[]
};

const webProvider = new Web3();
const ganacheProvider = provider(serverOptions);
//connect our provider with ganache-core
webProvider.setProvider(ganacheProvider);

async function migrateContracts() {
    const options = {
        logger: console,
        "contracts_build_directory": path.join(__dirname, '../ZapContracts/build/contracts'),
        "contracts_directory": path.join(__dirname, contractsDirectory),
        network: network,
        networks,
        provider: ganacheProvider,
        dryRun: true,
        "migrations_directory": path.join(__dirname, '../ZapContracts/migrations'),
        "network_id":5777,
        "hostname":"127.0.0.1",
        "port":7545,
    };
    try {
        await asyncMigrate(options);
        const abiPath = '../ZapContracts/build/contracts/ZapToken.json';
        const abiJSON = require(path.join(__dirname, abiPath));
        const zapToken = contract(abiJSON);
        zapToken.setProvider(ganacheProvider);
        const deplZapToken = await zapToken.deployed();
        const accounts = await webProvider.eth.getAccounts();
        const data = await deplZapToken.mint(deplZapToken.address, 140000, {from: accounts[0]});
        const balance = await deplZapToken.balanceOf(deplZapToken.address);
        console.log(balance.toString());
        closeServer();
    } catch(err) {
        console.log('errrrrr=====?>>>>>>',err);
        throw err;
    }
}

migrateContracts()
    .then(() => {})
    .catch(() => {});

function closeServer() {
    server.close();
}
require('chai').should();
