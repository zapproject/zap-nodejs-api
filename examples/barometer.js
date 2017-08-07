// This is an example provider of barometer data
const SynapseProvider = require('../src/provider.js');
const ds18x20 = require('ds18x20'); // Temperature library
const sys = require('sys');

if ( sys.argv.length != 2 ) {
    console.log("Usage:", sys.argv[0], "[market address]", "[group]", "[wei rate]");
    return;
}

const provider = new SynapseProvider(sys.argv[1], sys.argv[2], sys.argv[3]);

if ( !ds18x20.isDriverLoaded() ) {
    ds18x20.loadDriver();
    console.log("Loaded the ds18x20 driver");
}
else {
    console.log("The ds18x20 driver is already loaded.");
}

setInterval(() => {
    console.log("Publishing new data");
    provider.publish(ds18x20.getAll());
}, 10000);
