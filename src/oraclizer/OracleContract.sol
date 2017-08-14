pragma solidity ^0.4.14;

contract SynapseOracleContract {
    // A structure representing IPFS addresses and the merkle root of the data
    struct SynapseOracleData {
        bytes32 ipfsAddress; // IPFS address of the structure
        bytes32 merkleRoot;  // Merkle root of the structure
    }

    // The types of merkle events to add
    enum SynapseOracleTier {
        SynapseOracleLowTier,
        SynapseOracleMidTier,
        SynapseOracleHighTier
    }

    // A mapping of start timestamp to the oracle data
    mapping(uint256 => SynapseOracleData) highOracleData;
    mapping(uint256 => SynapseOracleData) midOracleData;
    mapping(uint256 => SynapseOracleData) lowOracleData;

    // A list of all dates of the oracle events
    uint256[] dates;

    // Who deployed the contract (owner)
    address owner;

    // Setup the owner
    function SynapseOracleContract() {
        owner = msg.sender;
    }

    // Modifier to make sure that only the owner is calling the functions
    modifier ownerOnly {
        if ( owner != msg.sender ) {
            _;
        }
    }

    // Add an oracle event (owner only!!)
    function addEvent(uint256 date,
                      SynapseOracleTier tier,
                      bytes32 ipfsAddress,
                      bytes32 merkleRoot)
                      ownerOnly {
        // Store the date
        dates.push(date);

        // Store the oracle data
        if ( tier == SynapseOracleTier.SynapseOracleHighTier ) {
            highOracleData[date] = SynapseOracleData(ipfsAddress, merkleRoot);
        }
        else if ( tier == SynapseOracleTier.SynapseOracleMidTier ) {
            midOracleData[date] = SynapseOracleData(ipfsAddress, merkleRoot);
        }
        else if ( tier == SynapseOracleTier.SynapseOracleLowTier ) {
            lowOracleData[date] = SynapseOracleData(ipfsAddress, merkleRoot);
        }
    }

    // Get the amount of dates available
    function getDateCount()
                         constant
                         returns (uint256) {
        return dates.length;
    }

    // Get a date
    function getDate(uint256 index)
                    constant
                    returns (uint256) {
        return dates[index];
    }

    // Get the merkle root of a certain date/type
    function getMerkleRoot(uint256 date,
                           SynapseOracleTier tier)
                           returns (bytes32) {
        if ( tier == SynapseOracleTier.SynapseOracleHighTier ) {
            return highOracleData[date].merkleRoot;
        }
        else if ( tier == SynapseOracleTier.SynapseOracleMidTier ) {
            return midOracleData[date].merkleRoot;
        }
        else if ( tier == SynapseOracleTier.SynapseOracleLowTier ) {
            return lowOracleData[date].merkleRoot;
        }
    }

    // Get the IPFS address of a certain date/type
    function getIPFSAddress(uint256 date,
                            SynapseOracleTier tier)
                            returns (bytes32) {
        if ( tier == SynapseOracleTier.SynapseOracleHighTier ) {
            return highOracleData[date].ipfsAddress;
        }
        else if ( tier == SynapseOracleTier.SynapseOracleMidTier ) {
            return midOracleData[date].ipfsAddress;
        }
        else if ( tier == SynapseOracleTier.SynapseOracleLowTier ) {
            return lowOracleData[date].ipfsAddress;
        }
    }
}
