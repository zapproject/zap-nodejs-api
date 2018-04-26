// This common entrypoint for browserify building script. 
// All new Contracts should be added here.
require('babel-polyfill');

const fs = require('fs');

global.ZapArbiterAbi = JSON.parse(fs.readFileSync(__dirname + '/../../contracts/abis/ZapAribiter.json'));
global.ZapBondageAbi = JSON.parse(fs.readFileSync(__dirname + '/../../contracts/abis/ZapBondage.json'));
global.ZapBondageStorageAbi = JSON.parse(fs.readFileSync(__dirname + '/../../contracts/abis/ZapBondageStorage.json'));
global.ZapDispatchAbi = JSON.parse(fs.readFileSync(__dirname + '/../../contracts/abis/ZapDispatch.json'));
global.ZapRegistryAbi = JSON.parse(fs.readFileSync(__dirname + '/../../contracts/abis/ZapRegistry.json'));
global.ZapTokenAbi = JSON.parse(fs.readFileSync(__dirname + '/../../contracts/abis/ZapToken.json'));

global.ZapArbiter = require("./ZapArbiter");
global.ZapBondage = require("./ZapBondage");
global.ZapBondageStorage = require("./ZapBondageStorage");
global.ZapDispatch = require("./ZapDispatch");
global.ZapRegistry = require("./ZapRegistry");
global.ZapToken = require("./ZapToken");
