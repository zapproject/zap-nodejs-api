#!/usr/bin/env node

console.log("hello zapcli");
const fs = require('fs');

var program = require('commander');


program
    .command('new [groupName] [weiRate] [callback]')
    .option('-p', '--AddProvider', 'add provider')
    .option('-s', '--AddSubscriber', 'add subs')
    .option('-a', '--AddAccount', 'add account')

    .action((groupName, weiRate, callback, option) => {
        if (option.P) {
            require('./initiateProvider')({
                action: 'new',
                groupName: groupName,
                weiRate: weiRate,
                callback:callback
            });
        } else if (option.S) {
            require('./subs')({
                action: 'new',
                groupName: groupName
            });
        } else if (option.A) {
            require('./newAccount');

        }
    });
program
    .command('load <fileName> [callback]')
    .option('-p', '--LoadProvider', 'add provider')
    .option('-s', '--LoadSubscriber', 'load subs')
    .option('-a', '--LoadAccount', 'load account')
    .action((fileName, callback, option) => {
        if (option.P) {
            require('./initiateProvider')({
                fileName: fileName,
                action: 'load',
                callback:callback
            });
        } else if (option.S) {
            require("./subs")({
                action: 'load',
                fileName: fileName
            });
        } else if (option.A) {
            require('./loadAccount')({
                fileName: fileName
            });

        }
    });

program
    .command('set <Address>')
    .option('--rpc', '--rpc', 'ADD RPC')
    .option('--ws', '--ws', 'ADD WEBSOCKET')
    .action((Address, option) => {

        if (option.rpc) {
            fs.writeFileSync(__dirname + "/NodeConfig/.rpcAddress", JSON.stringify({
                RPC: Address
            }));
            console.log('RPC host has been set');
        } else if (option.ws) {
            fs.writeFileSync(__dirname + "/NodeConfig/.wsAddress", JSON.stringify({
                WS: Address
            }));
            console.log('WS node has been set');

        }

    });





program.parse(process.argv);
