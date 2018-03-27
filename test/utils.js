const { eth } = require('./bootstrap')
const { network_id } = require('../config')
const objectToCreate = { from: '0x627306090abab3a6e1400e9345bc60c78a8bef57', gas: 6000000 }

function getInstanceOfSmartContract(abiFile) {
  return eth.contract(abiFile.abi).at(abiFile.networks[network_id].address)
}

async function getNewSmartContract(abiFile) {
  const contract = getEthContract(abiFile)
  const txHash = await contract.new(objectToCreate)
  const { contractAddress } = await eth.getTransactionReceipt(txHash)
  return eth.contract(abiFile.abi).at(contractAddress)
}

async function getNewRegistryContract({abiFile, regStoreAddress}) {
  const contract = getEthContract(abiFile)
  const txHash = await contract.new(regStoreAddress, objectToCreate)
  const { contractAddress } = await eth.getTransactionReceipt(txHash)
  return eth.contract(abiFile.abi).at(contractAddress)
}

async function getNewBondageContract({abiFile, bondStoreAddress, registryAddress, tokenAddress, currentCostAddress}) {
  const contract = getEthContract(abiFile)
  const txHash = await contract.new(
    bondStoreAddress, 
    registryAddress, 
    tokenAddress,
    currentCostAddress,
    objectToCreate
  )
  const { contractAddress } = await eth.getTransactionReceipt(txHash)
  return eth.contract(abiFile.abi).at(contractAddress)
}

async function getNewArbiterContract({ abiFile, arbiterStoreAddress, bondageAddress}) {
  const contract = getEthContract(abiFile)
  const txHash = await contract.new(
    arbiterStoreAddress, 
    bondageAddress, 
    objectToCreate
  )
  const { contractAddress } = await eth.getTransactionReceipt(txHash)
  return eth.contract(abiFile.abi).at(contractAddress)
}

async function getNewDispatchContract({ abiFile, dispatchStoreAddress, bondageAddress }) {
  const contract = getEthContract(abiFile)
  const txHash = await contract.new(
    dispatchStoreAddress, 
    bondageAddress, 
    objectToCreate
  )
  const { contractAddress } = await eth.getTransactionReceipt(txHash)
  return eth.contract(abiFile.abi).at(contractAddress)
}

function getEthContract({abi, bytecode}) {
  return eth.contract(abi, bytecode)
}

module.exports = {
  getInstanceOfSmartContract,
  getNewSmartContract,
  getNewBondageContract,
  getNewArbiterContract,
  getNewDispatchContract,
  getNewRegistryContract
}
