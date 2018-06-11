module.exports = {
    zaRegistryPath: '../src/contracts/abis/ZapRegistry.json',
    contractsBuildDirectory: '../ZapContracts/build/contracts',
    contractsDirectory: '../ZapContracts/contracts',
    workingDirectory: '../ZapContracts',
    runMigrationTimeOut: 5000,
    migrationsDirectory: '../ZapContracts/migrations',
    zapTokenAbi: '../ZapContracts/build/contracts/ZapToken.json',
    zapRegistryAbi: '../ZapContracts/build/contracts/Registry.json',
    zapArbiterAbi: '../ZapContracts/build/contracts/Arbiter.json',
    zapRegistryStorageAbi: '../ZapContracts/build/contracts/RegistryStorage.json',
    arbiterStorageAbi: '../ZapContracts/build/contracts/ArbiterStorage.json',
    bondageStorageAbi: '../ZapContracts/build/contracts/BondageStorage.json',
    zapBondageAbi:     '../ZapContracts/build/contracts/Bondage.json',
    currentCostAbi: '../ZapContracts/build/contracts/CurrentCost.json',
    addressSpacePointerAbi: '../ZapContracts/build/contracts/AddressSpacePointer.json',
    addressSpace: '../ZapContracts/build/contracts/AddressSpace.json',
    zapDispatchAbi: '../ZapContracts/build/contracts/Dispatch.json',
    zapDispatchStorageAbi: '../ZapContracts/build/contracts/DispatchStorage.json',
    queryCallerAbi: '../ZapContracts/build/contracts/QueryCaller.json',

    testNetwork: {
        address: `ws://127.0.0.1:9545`, // truffle develop rpc
        id: 4447
    },
    dockerNetwork: {
        address: 'ws://127.0.0.1:8546', // parity docker container
        id: 211211
    },
    ganacheNetwork: {
        address: 'ws://127.0.0.1:7545',
        id: 5777
    }
};
