// web3 interface
const Web3 = require('web3');
// import method that will deploy our contracts
const migrate = require('../node_modules/truffle-core/lib/commands/migrate');
// method that helps to resolve paths 
const path = require('path');
const fs = require('fs');

const { provider, server } = require('ganache-core');
const { ganacheServerOptions } = require('../config/server.js');

const { promisify } = require('util');
const asyncMigrate = promisify(migrate.run);
const {
    ganacheNetwork,
    contractsBuildDirectory,
    contractsDirectory,
    migrationsDirectory,
    workingDirectory
} = require('../config');

// initiate and run ganache server;
const ganacheServer = server(ganacheServerOptions);

ganacheServer.listen(7545, (err, blockchain) => {
    if (err) {
        throw err;
    }
    if (blockchain) {
        //  console.log(blockchain);
    }
});
console.log('server started on port: 7545');

const ganacheProvider = provider(ganacheServerOptions);


function getNetworkPort(network) {
    return network.address.split(':')[2];
}

function getNetworkHostname(network) {
    return network.address.split(':')[1].slice(2);
}

function clearDeploymentInfo(onlyRemoveNetworks = true) {
    const buildDir = path.join(__dirname, contractsBuildDirectory);
    let files = fs.readdirSync(buildDir);

    for (let i = 0; i < files.length; i++) {
        let filePath = buildDir + '/' + files[i];
        if (onlyRemoveNetworks) {
            let compiledJson = JSON.parse(fs.readFileSync(filePath));
            if (!compiledJson.networks) {
                continue;
            }

            compiledJson.networks = {};
            fs.writeFileSync(filePath, JSON.stringify(compiledJson), {flag: 'w'});
            console.log('deployment info for file ' + filePath + ' was cleared.');
        } else  {
            fs.unlinkSync(filePath);
            console.log('file ' + filePath + ' was deleted.');
        }
    }
}

async function migrateContracts() {
    const options = {
        "logger": console,
        "contracts_build_directory": path.join(__dirname, contractsBuildDirectory),
        "contracts_directory": path.join(__dirname, contractsDirectory),
        "working_directory": path.join(__dirname, workingDirectory),
        "migrations_directory": path.join(__dirname, migrationsDirectory),
        "network": 'ganache-gui',
        "network_id": ganacheNetwork.address,
        "provider": ganacheProvider,
        "hostname": 'localhost',
        "port": 7545,
        "gas": "6721975",
        "gasPrice": "10000000"
    };

    try {
        clearDeploymentInfo(false);
        await asyncMigrate(options);
        return Promise.resolve('done');
    } catch(err) {
        ganacheServer.close();
        throw err;
    }
}

module.exports = {
    migrateContracts,
    ganacheServer,
    ganacheProvider
};


try {
    // require('chai')
    //     .use(require('chai-as-promised'))
    //     .use(require('chai-bignumber'))
    //     .should();
    /*require('./tests/zapTokenTest');*/
    require('./tests/zapRegistryTest');
    /*require('./tests/zapBondageTest');
    require('./tests/zapArbiterTest');
    require('./tests/zapDispatchTest');*/
} catch (e) {
    console.log(e);
    ganacheServer.close();
}
