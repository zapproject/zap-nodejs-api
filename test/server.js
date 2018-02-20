const { server } = require('ganache-core');
const { serverOptions } = require('../config/server.js');

const ganacheServer = server(serverOptions);

ganacheServer.listen(7545, (err, log) => {
    console.log('server started on port: 7545');
    if(err) {
        console.log(err);
    }
    if(log) {
        console.log(log);
    }
});

module.exports = ganacheServer;
