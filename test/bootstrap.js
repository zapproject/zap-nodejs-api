const migrate = require('../node_modules/truffle-core/lib/commands/migrate');
const path = require('path');
const fs = require('fs');
const { provider, server } = require('ganache-core');
const { promisify } = require('util');
const asyncMigrate = promisify(migrate.run);
const Config = require('../config');
const test_contracts_build_directory = path.join(__dirname, 'TestArtifactsModule/contracts');

const ganacheServerOptions = {
  hostname: 'localhost',
  // "mnemonic": "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat",
  network_id: 5777,
  port: 7545,
  total_accounts: 10,
  ws: true,
};
// initiate and run ganache server;
const ganacheServer = server(ganacheServerOptions);
ganacheServer.listen(ganacheServerOptions.port, (err, blockchain) => {
  if (err) {
    throw err;
  }
  if (blockchain) {
    //  console.log(blockchain);
  }
});
console.log('server started on port: ' + ganacheServerOptions.port);
const testProvider = provider(ganacheServerOptions);

function clearBuild(onlyRemoveNetworks = true) {
  const buildDir = test_contracts_build_directory;
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
    } else {
      try {
        fs.unlinkSync(filePath);
        console.log('file ' + filePath + ' was deleted.');
      } catch (e){ console.error(e); }
    }
  }
}

async function migrateContracts() {
  const options = {
    logger: console,
    contracts_build_directory: test_contracts_build_directory,
    contracts_directory: path.join(Config.projectPath, Config.contractsDirectory),
    working_directory: path.join(Config.projectPath, Config.workingDirectory),
    migrations_directory: path.join(Config.projectPath, Config.migrationsDirectory),
    network: 'ganache-gui',
    network_id: ganacheServerOptions.id,
    provider: testProvider,
    hostname: ganacheServerOptions.hostname,
    port: ganacheServerOptions.port,
    gas: '6721975',
    gasPrice: '10000000',
  };

  try {
    clearBuild(false);
    await asyncMigrate(options);
    return Promise.resolve('done');
  } catch (err) {
    ganacheServer.close();
    throw err;
  }
}

module.exports = {
  migrateContracts,
  clearBuild,
  testProvider,
  testNetworkId: ganacheServerOptions.network_id,
  test_contracts_build_directory,
  ganacheServer
};


try {
  require('./tests/zapArbiterTest');
  // require('./tests/zapBondageTest');
  // require('./tests/zapDispatchTest');
  // require('./tests/zapTokenTest');
  // require('./tests/zapRegistryTest');
} catch (e) {
  console.log(e);
  ganacheServer.close();
} finally{
  ganacheServer.close();
}
