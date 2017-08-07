const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const fs = require('fs');

const marketContractSource = fs.readFileSync("./contracts/Market.sol").toString();
const marketContractCompiled = web3.eth.compile.solidity(marketContractSource);

console.log(marketContractCompiled);

if ( !marketContractCompiled.Market ) {
    console.error("Failed to compile contract");
    return;
}

const marketContract = web3.eth.contract(marketContractCompiled.Market.info.abiDefinition);

const market = marketContract.new({
    from: web3.eth.accounts[0],
    data: marketContractCompiled.Market.code,
    gas: 300000 // TODO
},
function (err, contract) {
    if ( err ) {
        throw err;
    }

    if ( !contract.address ) {
        console.log("Contraction is waiting to be mined. Transaction hash:", contract.transactionHash);
    }
    else {
        console.log("Contract mined, located at:", contract.address);
    }
});
