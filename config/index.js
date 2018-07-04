const path = require('path');
const fs = require('fs');
const Web3 = require('web3');

const contractsBuildDirectory = '/ZapContracts/build/contracts';
const contractsDirectory = '/ZapContracts/contracts';
const workingDirectory = '/ZapContracts';
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
const runMigrationTimeOut = 5000;
const projectPath = path.join(__dirname, '../');
const testArtifactsDir = path.join(projectPath, '/test/TestArtifactsModule/contracts');


const networks = {
    "test":{
        address: 'ws://127.0.0.1:9545', // truffle develop rpc
        id: 4447,
        provider: new Web3.providers.WebsocketProvider('ws://127.0.0.1:9545')
    },
    "docker":{
        host: 'ws://127.0.0.1', // parity docker container
        id: 211211,
        port: 8546,
        provider: new Web3.providers.WebsocketProvider('ws://127.0.0.1:8546')
    },
    "ganache":{
        host: 'ws://127.0.0.1', // ganache server for unit tests
        id: 5777,
        port: 7545,
        provider: new Web3.providers.WebsocketProvider('ws://127.0.0.1:7545')
    },
    "main":{
        host: 'ws://127.0.0.1',
        id: 1,
        port:8545,
        provider: new Web3.providers.WebsocketProvider('ws://127.0.0.1:8545')
    }
};

function getArtifact(artifactPath) {
    try {
        return JSON.parse(fs.readFileSync(path.join(projectPath, artifactPath)));
    }catch(e){
        console.error(e);
        return null
    }
}



module.exports = {
    contractsBuildDirectory,
    contractsDirectory,
    workingDirectory,
    migrationsDirectory,
    runMigrationTimeOut,
    projectPath,
    testArtifactsDir,

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

    networks,

    getArtifact,
    arbiterArtifact: getArtifact(arbiterAbiPath),
    registryArtifact: getArtifact(registryAbiPath),
    bondageArtifact: getArtifact(bondageAbiPath),
    dispatchArtifact: getArtifact(dispatchAbiPath),
    zapTokenArtifact: getArtifact(zapTokenAbiPath),
    currentCostArtifact: getArtifact(currentCostAbiPath),
    arbiterStorageArtifact: getArtifact(arbiterStorageAbiPath),
    registryStorageArtifact: getArtifact(registryStorageAbiPath),
    bondageStorageArtifact: getArtifact(bondageStorageAbiPath),
    dispatchStorageArtifact: getArtifact(dispatchStorageAbiPath),
};
