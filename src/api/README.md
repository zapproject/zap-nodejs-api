# Zap SDK

## Example

```javascript
// Load Ethereum
const Eth = require('ethjs');
const eth = new Eth(new Eth.HttpProvider('https://ropsten.infura.io'));

// Load Wallet
const wallet = new ZapWallet(eth, 'ropsten');

// Get Balance
wallet.getBalance((err, balance) => {
	console.log("You have", balance, "ZAP");
});

// Send 10 ZAP
wallet.send("0xadasda...", 10, (err, success) => {
	if ( err ) throw err;

	console.log(success ? "You sent 10 ZAP" : "Failed to send ZAP");
});

const registry = new ZapRegistry(eth, 'ropsten');

registry.getOracle('0xasdfasdfa...', (err, oracle) => {
	if ( err ) throw err;

	// Estimate the bond 10 ZAP to 0xasdfasf's smartcontract endpoint
	wallet.bondage.estimateBond(oracle, "smartcontract", 10, (err, numZap, numDot) => {
		if ( err ) throw err;

		console.log("You would receive", numDot);
		console.log("There would be", numZap, "left over");
	});

	// Bond 10 ZAP to 0xasdfasf's smartcontract endpoint
	wallet.bondage.bond(oracle, "smartcontract", 10, (err, numZap, numDot) => {
		if ( err ) throw err;

		console.log("You received", numDot);
		console.log("There was", numZap, "left over");
	});

	// Unbond 10 ZAP to 0xasdfasf's smartcontract endpoint
	wallet.bondage.unbond(oracle, "smartcontract", 10, (err, numZap, numDot) => {
		if ( err ) throw err;

		console.log("You received", numDot);
		console.log("There was", numZap, "left over");
	});
});
```
