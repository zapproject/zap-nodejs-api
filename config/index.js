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
    address: 'ws://127.0.0.1:9545', // truffle develop rpc
    id: 4447,
    provider: new Web3.providers.WebsocketProvider('ws://127.0.0.1:9545')
};

const dockerNetwork = {
    address: 'ws://127.0.0.1:8546', // parity docker container
    id: 211211,
    provider: new Web3.providers.WebsocketProvider('ws://127.0.0.1:8546')
};

const ganacheNetwork = {
    address: 'ws://127.0.0.1:7545', // ganache server for unit tests
    id: 5777,
    provider: new Web3.providers.WebsocketProvider('ws://127.0.0.1:7545')
};

const projectPath = path.join(__dirname, '../');

function getArtifact(artifactPath) {
    return JSON.parse(fs.readFileSync(path.join(projectPath, artifactPath)));
}

function getArbiterArtifact() {
    return JSON.parse(fs.readFileSync(path.join(projectPath, arbiterAbiPath)));
}

function getRegistryArtifact() {
    return JSON.parse(fs.readFileSync(path.join(projectPath, registryAbiPath)));
}

function getBondageArtifact() {
    return JSON.parse(fs.readFileSync(path.join(projectPath, bondageAbiPath)));
}

function getDispatchArtifact() {
    return JSON.parse(fs.readFileSync(path.join(projectPath, dispatchAbiPath)));
}

function getZapTokenArtifact() {
    return JSON.parse(fs.readFileSync(path.join(projectPath, zapTokenAbiPath)));
}

function getCurrentCostArtifact() {
    return JSON.parse(fs.readFileSync(path.join(projectPath, currentCostAbiPath)));
}

function getArbiterStorageArtifact() {
    return JSON.parse(fs.readFileSync(path.join(projectPath, arbiterStorageAbiPath)));
}

function getRegistryStorageArtifact() {
    return JSON.parse(fs.readFileSync(path.join(projectPath, registryStorageAbiPath)));
}

function getBondageStorageArtifact() {
    return JSON.parse(fs.readFileSync(path.join(projectPath, bondageStorageAbiPath)));
}

function getDispatchStorageArtifact() {
    return JSON.parse(fs.readFileSync(path.join(projectPath, dispatchStorageAbiPath)));
}

module.exports = {
    contractsBuildDirectory,
    contractsDirectory,
    workingDirectory,
    migrationsDirectory,
    runMigrationTimeOut,
    projectPath,

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

    getArtifact,
    arbiterArtifact: JSON.parse(fs.readFileSync(path.join(projectPath, arbiterAbiPath))),
    registryArtifact: JSON.parse(fs.readFileSync(path.join(projectPath, registryAbiPath))),
    bondageArtifact: JSON.parse(fs.readFileSync(path.join(projectPath, bondageAbiPath))),
    dispatchArtifact: JSON.parse(fs.readFileSync(path.join(projectPath, dispatchAbiPath))),
    zapTokenArtifact: JSON.parse(fs.readFileSync(path.join(projectPath, zapTokenAbiPath))),
    currentCostArtifact: JSON.parse(fs.readFileSync(path.join(projectPath, currentCostAbiPath))),
    arbiterStorageArtifact: JSON.parse(fs.readFileSync(path.join(projectPath, arbiterStorageAbiPath))),
    registryStorageArtifact: JSON.parse(fs.readFileSync(path.join(projectPath, registryStorageAbiPath))),
    bondageStorageArtifact: JSON.parse(fs.readFileSync(path.join(projectPath, bondageStorageAbiPath))),
    dispatchStorageArtifact: JSON.parse(fs.readFileSync(path.join(projectPath, dispatchStorageAbiPath))),

    getArbiterArtifact,
    getRegistryArtifact,
    getBondageArtifact,
    getDispatchArtifact,
    getZapTokenArtifact,
    getCurrentCostArtifact,
    getArbiterStorageArtifact,
    getRegistryStorageArtifact,
    getBondageStorageArtifact,
    getDispatchStorageArtifact
};
