const Web3 = require('web3');
const fs = require('fs');
const accounts = require('../account.js');
const solc = require('solc');

const rpcHost =  process.argv.slice(2)[0] != undefined ? process.argv.slice(2)[0] : "https://rinkeby.infura.io"
const web3 = new Web3(new Web3.providers.HttpProvider(rpcHost));
const privateKeyHex = process.argv.slice(2)[1] != undefined ? process.argv.slice(2)[1] : "0x8d2246c6f1238a97e84f39e18f84593a44e6622b67b8cebb7788320486141f95"

const account = new accounts(privateKeyHex);
//adds private key to web3 wallet
account.setWeb3(web3);

const filename = "./contracts/Market.sol";
//load contracts to be compiled in the format digestable by solc
var input = {sources: {
    filename: fs.readFileSync(filename).toString(),
}}

const marketContractCompiled = compileContracts(input);
var contractParams = {
        data: marketContractCompiled.SynapseMarket.bytecode
}    

const marketContract = new web3.eth.Contract(marketContractCompiled.SynapseMarket.abi, contractParams)

    var deployParams = {
        from: web3.eth.accounts.wallet[0].address,
        data: marketContractCompiled.SynapseMarket.bytecode,
        gas: 680000 // TODO
}

marketContract.deploy().send(deployParams, function(error,transactionHash){

}).on('error', function(error){
    console.log('error');
    console.log(error);
}).on('transactionHash', function(transactionHash){
    console.log('transactionHash');
    console.log(transactionHash);
}).on('receipt', function(receipt){
   console.log('receipt.contractAddress') 
   console.log(receipt.contractAddress) 
})
.on('confirmation', function(confirmationNumber, receipt){ 
    console.log('confirmationNumber');
    console.log(confirmationNumber);
    console.log('receipt');
    console.log(receipt);
})
.then(function(newContractInstance){
    console.log('newContractInstance') 
    console.log(newContractInstance) 
});

//TODO figure out why web3 compiler eth_compileSolidity method doesnt exist
//const marketContractCompiled = web3.eth.compile.solidity(marketContractSource);
function compileContracts(input) {
    const output = solc.compile(input, 1);
    var result = {};
    for (var k in  output.contracts) {
        const contractKey = k.split(':').pop();
        const bytecode = output.contracts[k].bytecode;
        const abi = JSON.parse(output.contracts[k].interface);
        result[contractKey] = {
            bytecode: bytecode,
            abi: abi
        }
    }
    return result;
}


