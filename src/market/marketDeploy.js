const Web3 = require('web3');
const fs = require('fs');
const accounts = require('../account.js');
const solc = require('solc');

// Parse the arguments from command line
const args = process.argv.slice(2);

// Read the RPC host and load it with Web3
const rpcHost = args[0] || "https://rinkeby.infura.io";
const web3 = new Web3(new Web3.providers.HttpProvider(rpcHost));

// Read the private key
const privateKeyHex = args[1] || "0x8d2246c6f1238a97e84f39e18f84593a44e6622b67b8cebb7788320486141f95";
const account = new accounts(privateKeyHex);

// Add the private key to web3 wallet
account.setWeb3(web3);

// Locate the address currently attached
const fromAddress = web3.eth.accounts.wallet[0].address;

// Deploy the market contract
compileAndDeployContract([ "./contracts/Market.sol" ], fromAddress);

// Compile and deploy a contract to Ethereum
function compileAndDeployContract(sources, fromAddress) {
    // Compile the contract
    const marketContractCompiled = compileContracts(sources);

    // Institiate the contract
    const marketContract = new web3.eth.Contract(marketContractCompiled.SynapseMarket.abi);

    // Deploy the contract
    marketContract.deploy({
        data: "0x" + marketContractCompiled.SynapseMarket.bytecode,
        arguments: []
    }).send({
        from: fromAddress,
        gas: 3000000
    }, function(error,transactionHash){

    }).on('error', function(error){
        console.log('error');
        console.log(error);
    }).on('transactionHash', function(transactionHash){
        console.log('transactionHash');
        console.log(transactionHash);
    }).on('receipt', function(receipt){
        console.log('receipt.contractAddress');
        console.log(receipt.contractAddress);
    })
    .on('confirmation', function(confirmationNumber, receipt){
        console.log('confirmationNumber');
        console.log(confirmationNumber);
        console.log('receipt');
        console.log(receipt);
    })
    .then(function(newContractInstance){
        console.log('newContractInstance');
        console.log(newContractInstance);
    }).catch((err) => {
        console.log("Caught error");
        console.error(err);
    });
}

// Compile the source code using solcjs
function compileContracts(source_files) {
    // Load the inputs
    const sources = {};

    for ( const file of source_files ) {
        sources[file] = fs.readFileSync(file);
    }

    // Compile the input
    const output = solc.compile({
        sources: sources
    }, 1);
    console.log(ouput);
    const result = {};

    // Parse all compiled contracts
    for ( const k in  output.contracts ) {
        // Find which contract was compiled
        const contractKey = k.split(':').pop();
        const contract = output.contracts[k];

        // Get the bytecode and ABI
        const bytecode = contract.bytecode;
        const abi = JSON.parse(contract.interface);

        result[contractKey] = {
            bytecode: bytecode,
            abi: abi
        };
    }

    return result;
}
