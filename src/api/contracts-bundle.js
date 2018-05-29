// This common entrypoint for browserify building script. 
// All new Contracts should be added here.
require('babel-polyfill');

const fs = require('fs');

// Truffle contracts artifacts
global.ZapArbiterArtifact = JSON.parse(fs.readFileSync(__dirname + '/../../ZapContracts/build/contracts/Arbiter.json'));
global.ZapBondageArtifact = JSON.parse(fs.readFileSync(__dirname + '/../../ZapContracts/build/contracts//Bondage.json'));
global.ZapBondageStorageArtifact = JSON.parse(fs.readFileSync(__dirname + '/../../ZapContracts/build/contracts/BondageStorage.json'));
global.ZapDispatchArtifact = JSON.parse(fs.readFileSync(__dirname + '/../../ZapContracts/build/contracts/Dispatch.json'));
global.ZapRegistryArtifact = JSON.parse(fs.readFileSync(__dirname + '/../../ZapContracts/build/contracts/Registry.json'));
global.ZapTokenArtifact = JSON.parse(fs.readFileSync(__dirname + '/../../ZapContracts/build/contracts/ZapToken.json'));

// Contract wrappers
global.ZapArbiter = require("./contracts/Arbiter");
global.ZapBondage = require("./contracts/Bondage");
// global.ZapBondageStorage = require("./contracts/BondageStorage");
global.ZapDispatch = require("./contracts/Dispatch");
global.ZapRegistry = require("./contracts/Registry");
global.ZapToken = require("./contracts/ZapToken");
