pragma solidity ^0.4.14;

import "/Users/avisaven/Documents/Projects/synapse-poc/src/market/contracts/Market.sol";
import "./SynToken.sol";

contract IQToken {
    event AnchorRequestReceived(address _address);
    event AnchorRequestAccepted(address _address);
    event InsufficientIQ(uint256 needed, uint256 balance);
    event InsufficientSyn(uint256 needed, uint256 balance);
    event SynReceived(address _address, uint256 amount);
    event InvalidDeposit();
    event InvalidWithdrawal(uint256 requested, uint256 available);

    SynToken public synToken;
    SynapseMarket public market;

    mapping(address => uint256) synDeposits;
    mapping(address => uint256) iqBalances;

    // Initialize market and token contracts
    function IQToken(address token_address,
                     address market_address) {
        synToken = SynToken(token_address);
        market = SynapseMarket(market_address);
    }

    // Recieve request from provider, approve/deny
    function requestAnchor()
                          external
                          constant
                          returns (bool) {
        AnchorRequestReceived(msg.sender);

        // Check iq balance
        if ( !enoughIQ(synToken.balanceOf(msg.sender)) ) {
            return false;
        }

        return true;
    }

    //calc if enough iq available
    //TODO iq incrementation += generation, iq decrementation -= iq cost
    function enoughIQ(uint256 syndeposit)
                      internal
                      constant
                      returns(bool) {
        uint256 iq = synToken.balanceOf(msg.sender);

        if ( iq < 1 ) {
            return false;
        }

        return true;
    }

    //recieve deposit from provider address
    function deposit(uint256 value)
                     external
                     returns (bool) {
        // Approve market to transfer
        syn.approve(this, amount);

        // Attempt transfer
        if ( !synToken.transferFrom(msg.sender, this, value) ) {
            InvalidDeposit();
            return false;
        }

        // Add to deposit
        synDeposits[msg.sender] += value;

        return true;
    }

    // Withdraw syn
    function withdraw(uint256 value)
                      external
                      returns(bool) {
        // Check available deposit
        if ( value > synDeposits[msg.sender] ) {
            InvalidWithdrawal(value,synDeposits[msg.sender]);
            return false;
        }

        // Approve market to transfer
        syn.approve(this, amount);

        // Withdraw
        synToken.transferFrom(this, msg.sender, value);

        return true;
    }
}
