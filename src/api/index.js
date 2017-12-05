#!/usr/bin/env node

console.log("hello zapcli")
var program = require('commander');

// program
//     .command('new -a')
//     .option('-a', '--Account', 'add new Ethereum account')
//     .action((option) => {
//         if (option.A) {
//             var newAccount = require('./newAccount')
//         }
//     })
program
    .command('new [groupName] [weiRate]')
    .option('-p', '--AddProvider', 'add provider')
    .option('-s', '--AddSubscriber', 'add subs')
    .option('-a', '--AddAccount', 'add account')

.action((groupName, weiRate, option) => {
    if (option.P) {
        const provider = require('./provider')({
            action: 'new',
            groupName: groupName,
            weiRate: weiRate
        })
    } else if (option.S) {
        const subscriber = require('./subs')({
            action: 'new',
            groupName: groupName
        })
    } else if (option.A) {
        var newAccount = require('./newAccount')

    }
})
program
    .command('load <fileName>')
    .option('-p', '--LoadProvider', 'add provider')
    .option('-s', '--LoadSubscriber', 'load subs')
    .option('-a', '--LoadAccount', 'load account')
    .action((fileName, option) => {
        if (option.P) {
            var provider = require('./provider')({
                fileName: fileName,
                action: 'load'
            })
        } else if (option.S) {
            var subscriber = require("./subs")({
                action: 'load',
                fileName: fileName
            });
        }else if (option.A) {
        var newAccount = require('./loadAccount')({fileName:fileName})

    }
    })






program.parse(process.argv);
