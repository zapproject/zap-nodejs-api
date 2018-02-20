const { server } = require('ganache-core');

const serverOptions = {
    "hostname":"127.0.0.1",
    "mnemonic":"candy maple cake sugar pudding cream honey rich smooth crumble sweet treat",
    "network_id":5777,
    "port":7545,
    "total_accounts":10,
    "unlocked_accounts":[],
    logger: console
};

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
