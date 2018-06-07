const { server } = require('ganache-core');
const { serverOptions } = require('../config/server.js');

const ganacheServer = server(serverOptions);

module.exports.serverOptions = serverOptions;
module.exports.server = ganacheServer;
