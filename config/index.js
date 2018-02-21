module.exports = {
    network: 'testSdk',
    port: 7545,
    endpoint: '127.0.0.1',
    protocol:'http://',
    zaRegistryPath: '../src/contracts/abis/ZapRegistry.json',
    contractsBuildDirectory: '../ZapContracts/build/contracts',
    contractsDirectory: '../ZapContracts/contracts',
    network_id: 5777,
    migrationsDirectory: '../ZapContracts/migrations',
    zapTokenAbi: '../ZapContracts/build/contracts/ZapToken.json',
    runMigrationTimeOut: 5000
};
