const objectToCreate = { from: '0x627306090abab3a6e1400e9345bc60c78a8bef57', gas: 6000000 };
const BigNumber = require('bignumber.js');
const fs = require('fs');
const Curve = require('../src/api/components/Curve');
const Contract = require("truffle-contract");

function fixTruffleContractCompatibilityIssue(contract) {
    if (!contract.currentProvider.sendAsync || typeof contract.currentProvider.sendAsync !== "function") {
        contract.currentProvider.sendAsync = function() {
            return contract.currentProvider.send.apply(
                contract.currentProvider, arguments
            );
        };
    }
    return contract;
}

function getDeployedContract(artifactsPath, artifactName, id, provider) {
    let files = fs.readdirSync(artifactsPath);
    for (let i = 0; i < files.length; i++) {
        if (files[i] === artifactName + '.json' || files[i] === artifactName) {
            let file = artifactsPath + '/' + files[i];
            let artifact = JSON.parse(fs.readFileSync(file).toString());
            let instance = Contract(artifact);
            instance.setProvider(provider);
            instance = fixTruffleContractCompatibilityIssue(instance);
            return instance.at(artifact.networks[id].address);
        }
    }
}


const providerTitle = "test";
const providerPublicKey = 111;
const params = ["p1", "p2"];
const specifier = "test-linear-specifier";
const oracleEndpoint = specifier.valueOf();
const gasTransaction = new BigNumber(3000000);
const tokensForOwner = new BigNumber("1e30");
const tokensForOracle = new BigNumber('1e24');
const allocateAccount = 300000;
const query = "Why?";
const curve = new Curve([2, 2, 0, 1, 1, 1, 10, 0, 0], [0, 5, 5, 10], [1, 3]);
const TruffleContract = Contract;


module.exports = {
    providerTitle,
    providerPublicKey,
    params,
    specifier,
    oracleEndpoint,
    gasTransaction,
    tokensForOwner,
    tokensForOracle,
    allocateAccount,
    query,
    curve,
    fixTruffleContractCompatibilityIssue,
    getDeployedContract,
    TruffleContract
};
