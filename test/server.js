const { server } = require('ganache-core');


const ganacheServer = server(serverOptions);

module.exports.serverOptions = serverOptions;
module.exports.server = ganacheServer;
