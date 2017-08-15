pragma solidity ^0.4.14;
import "browser/SynapseMarket.sol";
import "browser/SynToken.sol";


contract IQToken{
    
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
    
    
    function IQToken(address token_address, address market_address){

        //initialize market and token contractsll,
        synToken = SynToken(token_address);
        market = SynapseMarket(market_address);
    }

    //recieve request from provider, approve/deny
    function requestAnchor() external constant returns(bool){

        AnchorRequestReceived(msg.sender);
        //check iq balance
        if(!enoughIQ(synToken.balanceOf(msg.sender))){
            return false;
        }
        
        return true;
    }
    
    //calc if enough iq available
    //TODO iq incrementation += generation, iq decrementation -= iq cost
    function enoughIQ(uint256 syndeposit) internal constant returns(bool){
        uint256 iq = synToken.balanceOf(msg.sender);
        if(iq < 1){
            return false;
        }
        return true;
    }
    
    //recieve deposit from provider address
    function deposit(uint256 value) external returns(bool){

        //approve market to transfer
        syn.approve(this, amount);
        //attempt transfer
        if(!synToken.transferFrom(msg.sender, this, value)){
            InvalidDeposit();
            return false;
        }
        
        //add to deposit 
        synDeposits[msg.sender]+=value;
        return true;
    }
    
    //withdraw syn
    function withdraw(uint256 value) external returns(bool){
        
        //check available deposit
        if(value > synDeposits[msg.sender]){
            InvalidWithdrawal(value,synDeposits[msg.sender]);
            return false;
        }
        
        //approve market to transfer
        syn.approve(this, amount);
        //withdraw
        synToken.transferFrom(this, msg.sender, value);
        return true;
    }
    
}