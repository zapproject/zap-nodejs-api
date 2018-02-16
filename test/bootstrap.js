const Web3 = require('web3');
const { provider } = require('ganache-core');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
web3.setProvider(provider());

web3.eth.getAccounts().then(data => console.log(data));