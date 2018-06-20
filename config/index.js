const path = require('path');
const fs = require('fs');
const Web3 = require('web3');

const contractsBuildDirectory = '/ZapContracts/build/contracts';
const contractsDirectory = '/ZapContracts/contracts';
const workingDirectory = '/ZapContracts';
const runMigrationTimeOut = 5000;
const migrationsDirectory = '/ZapContracts/migrations';
const zapTokenAbiPath = '/ZapContracts/build/contracts/ZapToken.json';
const registryAbiPath = '/ZapContracts/build/contracts/Registry.json';
const arbiterAbiPath = '/ZapContracts/build/contracts/Arbiter.json';
const registryStorageAbiPath = '/ZapContracts/build/contracts/RegistryStorage.json';
const arbiterStorageAbiPath = '/ZapContracts/build/contracts/ArbiterStorage.json';
const bondageStorageAbiPath = '/ZapContracts/build/contracts/BondageStorage.json';
const bondageAbiPath = '/ZapContracts/build/contracts/Bondage.json';
const currentCostAbiPath = '/ZapContracts/build/contracts/CurrentCost.json';
const dispatchAbiPath = '/ZapContracts/build/contracts/Dispatch.json';
const dispatchStorageAbiPath = '/ZapContracts/build/contracts/DispatchStorage.json';
const queryCallerAbiPath = '/ZapContracts/build/contracts/QueryCaller.json';

const testNetwork = {
    address: `ws://127.0.0.1:9545`, // truffle develop rpc
    id: 4447,
    provider: new Web3.providers.WebsocketProvider(this.address)
};

const dockerNetwork = {
    address: 'ws://127.0.0.1:8546', // parity docker container
    id: 211211,
    provider: new Web3.providers.WebsocketProvider(this.address)
};

const ganacheNetwork = {
    address: 'ws://127.0.0.1:7545', // ganache server for unit tests
    id: 5777,
    provider: new Web3.providers.WebsocketProvider(this.address)
};

const projectPath = path.join(__dirname, '../');

const arbiterArtifact = JSON.parse(fs.readFileSync(path.join(projectPath, arbiterAbiPath)));
const registryArtifact = JSON.parse(fs.readFileSync(path.join(projectPath, registryAbiPath)));
const bondageArtifact = JSON.parse(fs.readFileSync(path.join(projectPath, bondageAbiPath)));
const dispatchArtifact = JSON.parse(fs.readFileSync(path.join(projectPath, dispatchAbiPath)));
const zapTokenArtifact = JSON.parse(fs.readFileSync(path.join(projectPath, zapTokenAbiPath)));

module.exports = {
    contractsBuildDirectory,
    contractsDirectory,
    workingDirectory,
    migrationsDirectory,
    runMigrationTimeOut,

    dispatchAbi: dispatchAbiPath,
    dispatchStorageAbi: dispatchStorageAbiPath,
    bondageAbi: bondageAbiPath,
    bondageStorageAbi: bondageStorageAbiPath,
    registryAbi: registryAbiPath,
    registryStorageAbi: registryStorageAbiPath,
    arbiterAbi: arbiterAbiPath,
    arbiterStorageAbi: arbiterStorageAbiPath,
    zapTokenAbi: zapTokenAbiPath,
    currentCostAbi: currentCostAbiPath,
    queryCallerAbi: queryCallerAbiPath,

    testNetwork,
    dockerNetwork,
    ganacheNetwork,

    arbiterArtifact,
    registryArtifact,
    bondageArtifact,
    dispatchArtifact,
    zapTokenArtifact
};
