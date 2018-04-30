// This common entrypoint for browserify building script. 
// All new Contracts should be added here.
require('babel-polyfill');

const fs = require('fs');

global.ZapArbiterAbi = JSON.parse(fs.readFileSync(__dirname + '/../contracts/abis/ZapAribiter.json'));
global.ZapBondageAbi = JSON.parse(fs.readFileSync(__dirname + '/../contracts/abis/ZapBondage.json'));
global.ZapBondageStorageAbi = JSON.parse(fs.readFileSync(__dirname + '/../contracts/abis/ZapBondageStorage.json'));
global.ZapDispatchAbi = JSON.parse(fs.readFileSync(__dirname + '/../contracts/abis/ZapDispatch.json'));
global.ZapRegistryAbi = JSON.parse(fs.readFileSync(__dirname + '/../contracts/abis/ZapRegistry.json'));
global.ZapTokenAbi = JSON.parse(fs.readFileSync(__dirname + '/../contracts/abis/ZapToken.json'));

global.ZapArbiter = require("./contracts/ZapArbiter");
global.ZapBondage = require("./contracts/ZapBondage");
global.ZapBondageStorage = require("./contracts/ZapBondageStorage");
global.ZapDispatch = require("./contracts/ZapDispatch");
global.ZapRegistry = require("./contracts/ZapRegistry");
global.ZapToken = require("./contracts/ZapToken");
