pragma solidity ^0.4.8;

// @title Math operations with safety checks

contract SafeMath {

  function safeMul(uint a, uint b) internal returns (uint) {

    uint c = a * b;

    assert(a == 0 || c / a == b);

    return c;

  }

  function safeDiv(uint a, uint b) internal returns (uint) {

    assert(b > 0);

    uint c = a / b;

    assert(a == b * c + a % b);

    return c;

  }

  function safeSub(uint a, uint b) internal returns (uint) {

    assert(b <= a);

    return a - b;

  }

  function safeAdd(uint a, uint b) internal returns (uint) {

    uint c = a + b;

    assert(c>=a && c>=b);

    return c;

  }

  function max64(uint64 a, uint64 b) internal constant returns (uint64) {

    return a >= b ? a : b;

  }

  function min64(uint64 a, uint64 b) internal constant returns (uint64) {

    return a < b ? a : b;

  }

  function max256(uint256 a, uint256 b) internal constant returns (uint256) {

    return a >= b ? a : b;

  }

  function min256(uint256 a, uint256 b) internal constant returns (uint256) {

    return a < b ? a : b;

  }

  function assert(bool assertion) internal {

    if (!assertion) {

      revert();

    }

  }

}

 
 
 
 pragma solidity ^0.4.8;
     // ERC Token Standard #20 Interface
     // https://github.com/ethereum/EIPs/issues/20
     contract ERC20Interface {
         // Get the total token supply
         function totalSupply() constant returns (uint256 totalSupply);
      
         // Get the account balance of another account with address _owner
         function balanceOf(address _owner) constant returns (uint256 balance);
      
         // Send _value amount of tokens to address _to
         function transfer(address _to, uint256 _value) returns (bool success);
      
         // Send _value amount of tokens from address _from to address _to
         function transferFrom(address _from, address _to, uint256 _value) returns (bool success);
      
         // Allow _spender to withdraw from your account, multiple times, up to the _value amount.
         // If this function is called again it overwrites the current allowance with _value.
         // this function is required for some DEX functionality
         function approve(address _spender, uint256 _value) returns (bool success);
      
         // Returns the amount which _spender is still allowed to withdraw from _owner
         function allowance(address _owner, address _spender) constant returns (uint256 remaining);
      
         // Triggered when tokens are transferred.
         event Transfer(address indexed _from, address indexed _to, uint256 _value);
      
         // Triggered whenever approve(address _spender, uint256 _value) is called.
         event Approval(address indexed _owner, address indexed _spender, uint256 _value);
     }
      
    contract SynToken is ERC20Interface {
         string public constant symbol = "SYN";
         string public constant name = "SynToken";
         uint8 public constant decimals = 18;
         uint256 _totalSupply = 1000000000;
         
         // Owner of this contract
         address public owner;
      
      
          event Transfer(address indexed _from, address indexed _to, uint256 _value);
          event Approval(address indexed _owner, address indexed _spender, uint256 _value);
      
         // Balances for each account
         mapping(address => uint256) balances;
      
         // Owner of account approves the transfer of an amount to another account
         mapping(address => mapping (address => uint256)) allowed;
      
         // Functions with this modifier can only be executed by the owner
         modifier onlyOwner() {
             if (msg.sender != owner) {
                 throw;
             }
             _;
         }
      
         // Constructor
         function SynToken(address admin) {
             owner = address(admin);
             balances[owner] = _totalSupply;
         }
      
         function totalSupply() constant returns (uint256 totalSupply) {
             totalSupply = _totalSupply;
         }
      
         // What is the balance of a particular account?
         function balanceOf(address _owner) constant returns (uint256 balance) {
             return balances[_owner];
         }
      
         // Transfer the balance from owner's account to another account
         function transfer(address _to, uint256 _amount) returns (bool success) {
             if (balances[msg.sender] >= _amount 
                 && _amount > 0
                 && balances[_to] + _amount > balances[_to]) {
                 balances[msg.sender] -= _amount;
                 balances[_to] += _amount;
                 Transfer(msg.sender, _to, _amount);
                 return true;
             } else {
                 return false;
             }
         }
      
         // Send _value amount of tokens from address _from to address _to
         // The transferFrom method is used for a withdraw workflow, allowing contracts to send
         // tokens on your behalf, for example to "deposit" to a contract address and/or to charge
         // fees in sub-currencies; the command should fail unless the _from account has
         // deliberately authorized the sender of the message via some mechanism; we propose
         // these standardized APIs for approval:
         function transferFrom(
             address _from,
             address _to,
             uint256 _amount
         ) returns (bool success) {
             if (balances[_from] >= _amount
                 && allowed[_from][msg.sender] >= _amount
                 && _amount > 0
                 && balances[_to] + _amount > balances[_to]) {
                 balances[_from] -= _amount;
                 allowed[_from][msg.sender] -= _amount;
                 balances[_to] += _amount;
                 Transfer(_from, _to, _amount);
                 return true;
             } else {
                 return false;
             }
         }
      
         // Allow _spender to withdraw from your account, multiple times, up to the _value amount.
         // If this function is called again it overwrites the current allowance with _value.
         function approve(address _spender, uint256 _amount) returns (bool success) {
             allowed[msg.sender][_spender] = _amount;
             Approval(msg.sender, _spender, _amount);
             return true;
         }
      
         function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
             return allowed[_owner][_spender];
         }
    }







pragma solidity ^0.4.8;
//to revise for testing



contract IQToken is SynToken, SafeMath{
    
    
    event AnchorRequestReceived(address _address);
    event AnchorRequestStatus(string Status);
    event InsufficientIQ(uint256 needed, uint256 balance);
    event InsufficientSyn(uint256 needed, uint256 balance);
    event SynReceived(address _address, uint256 amount);
    event InvalidDeposit();
    event InvalidWithdrawal(uint256 requested, uint256 available);

   
   
    address public owner;
    uint    public synValue;
    
    
    mapping(address => uint256)      synDeposits;
    mapping(address => uint256)       iqBalances;
    mapping(string  =>  uint256)       iqRequired;
    mapping(address =>  uint256) lastFunctionCall;
    mapping(string  =>  bool)    approveAnchoring;
    
    struct Ranges{
        uint min;
        uint max;
        uint divisor;
      
        
    }
    
    Ranges[] ranges;
    
    
  
    
    // Initialize market and token contracts
    function IQToken(uint value) {
       
       owner =msg.sender;
       synValue=value;
       
       
        
    }
    
    
    //onlyOwner function
    modifier onlyOwner() {
             if (msg.sender != owner) {
                 throw;
             }
             _;
         }
      

    
    
    
    //check IQ required for anchoring data
    // Parameter transactionid is gasprice for oracalization
    //This function multiplie syntokenbalance of msg.sender with value of syn at exchange than subtracts gasprice of oracalization and divides it by divisor accoridng to the range set by owner
    //
    
    // Recieve request from provider,approve/deny based on oracalizatrion gas cost and Datahash
    // Can be replaced by a struct called user that holds all the details like Datahash,transactionid but there might be scalability Problems
    //For now I am just using mapppings
    //Transaction
    function requestAnchor(string DataHash,uint256 Transactionid)
                          external
                          constant
                          returns (bool) {
        AnchorRequestReceived(msg.sender);
        setIQrequired(DataHash,Transactionid);
        
        
        //Check that Data Hash is valid
        
             // Check iq balance
            if (iqBalances[msg.sender]<iqRequired[DataHash]){
                return false;
                AnchorRequestStatus("Failed"); 
                InsufficientIQ(safeSub(iqRequired[DataHash],iqBalances[msg.sender]),iqBalances[msg.sender]);
                throw;
            }
            
            else{
                //Decrementing the IQ here
                //Transactionid returns the oracalization gas cost with 
                //expecting it returns  value say in wei
                //Right now IQ balance becomes z
                iqBalances[msg.sender]-=iqRequired[DataHash];
                
                
                return true;
                AnchorRequestStatus("Success");
                
            }
            
        
       
        
        
    }

    //calc if enough iq available
    //TODO iq incrementation += generation, iq decrementation -= iq cost
    function GenerateIQ()
                      internal
                      constant
                      returns(bool,uint iqgenerated){
        uint256 bondedSyn =synDeposits[msg.sender];
        if ((now - lastFunctionCall[msg.sender]) <= 10 minutes) throw;
        
        if (synDeposits[msg.sender]>=ranges[0].min){
          
          // still need to figure this out 
          iqBalances[msg.sender]+=bondedSyn/2;
          lastFunctionCall[msg.sender]=now; 
          
            
            
            
            
        }
        
        
            
        

        return (true,iqBalances[msg.sender]) ;
    }

    //recieve deposit from provider address
    function deposit(uint256 value)
                     external
                     returns (bool) {
        // Approve market to transfer
        approve(this, value);

        // Attempt transfer
        if ( !transferFrom(msg.sender, this, value) ) {
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
        approve(this, value);

        // Withdraw
        transferFrom(this, msg.sender, value);

        return true;
    }
    
    //Check IQ Balance
    function iqBalance() returns(uint Balance){
        return(iqBalances[msg.sender]);
    }
    
    //Set syntoken value for  single token so its faster than calling some exchange API
    //Input the value in wei
    
    function setSynvalue(uint value)  returns(uint){
        synValue=value;
        return(synValue);
        
    }
    
    //Owner defines range and divisor which will decide the amount of Iq required for Anchoring data
    //Here rng is range name which will be an integer,we can log these ranges based on this range index
    //Divisor is the number that the providers Syntoken balance will be divided by when he requests for anchoring event
    
    function defineRange(uint rng,uint min, uint max,uint divisor) onlyOwner returns(bool){
           
           ranges[rng]=Ranges(min,max,divisor);
           return(true);
        
    }
    
    
    // Get  getrange that your Syntoken Balance falls in
    function getRange(uint value) private returns(uint){
        for(uint i=0;i<=(ranges.length);i++){
            if(value>=ranges[i].min && value<=ranges[i].max){
                return(i);
            }
            else{
                throw;
            }
        
        }
        
        
    }
    
    
    //check IQ required for anchoring data
    // Parameter transactionid is gasprice for oracalization
    //This function multiplie syntokenbalance of msg.sender with value of syn at exchange than subtracts gasprice of oracalization and divides it by divisor accoridng to the range set by owner
    //
    function setIQrequired(string Datahash,uint transactionId) returns(uint) {
            
            for(uint i=0;i<=(ranges.length);i++){
                if(balanceOf(msg.sender)>=ranges[i].min && balanceOf(msg.sender)<=ranges[i].max){
                    iqRequired[Datahash]=safeDiv(safeSub(safeMul(balanceOf(msg.sender),synValue),transactionId),ranges[i].divisor);
                    return(iqRequired[Datahash]);
                    
                
                }
                else{
                    throw;
                }
            }
            
        
        
        
        
    }
    
    
    
    
    
}
