pragma solidity ^0.4.14;

contract ERC20Basic {
    uint256 public totalSupply;
    function balanceOf(address who) public constant returns (uint256);
    function transfer(address to, uint256 value) public returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
}
/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 is ERC20Basic {
    function allowance(address owner, address spender) public constant returns (uint256);
    function transferFrom(address from, address to, uint256 value) public returns (bool);
    function approve(address spender, uint256 value) public returns (bool);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

pragma solidity ^0.4.14;

contract Registry {
    struct ZapOracle {
        uint256 public_key;                  // Public key of the user
        uint256[] route_keys;                // IPFS routing/other
        string title;                        // Tags (csv)
        mapping(bytes32 => ZapCurve) curves; // Price vs Supply (contract endpoint)
   }

    enum ZapCurveType {
        ZapCurveNone,
        ZapCurveLinear,
        ZapCurveExponential,
        ZapCurveLogarithmic
    }

    struct ZapCurve {
        ZapCurveType curveType;
        uint256 curveStart;
        uint256 curveMultiplier;
    }

    mapping(address => ZapOracle) oracles;

    function initiateProvider(uint256 public_key,
                              uint256[] ext_info,
                              string title)
                              public;

    function initiateProviderCurve(bytes32 specifier,
                                   ZapCurveType curveType,
                                   uint256 curveStart,
                                   uint256 curveMultiplier)
                                   public;

    function getProviderRouteKeys(address provider)
                                  public
                                  view
                                  returns(uint256[]);

    function getProviderTitle(address provider)
                              public
                              view
                              returns(string);

    function getProviderPublicKey(address provider)
                                  public
                                  view
                                  returns(uint256);

    function getProviderCurve(address provider,
                              bytes32 specifier)
                              view
                              public
                              returns (
                                  ZapCurveType curveType,
                                  uint256 curveStart,
                                  uint256 curveMultiplier
                                );
                              
    function exportProviderCurve(address provider,
                                bytes32 specifier) 
                                public 
                                returns(
                                    uint256 curveType,
                                    uint256 curveStart,
                                    uint256 curveMultiplier
                                );
}

contract Bondage{
    
    struct Bond{
        uint numDots;
        address oracle;
    }

    struct Holder{
        address _address;
        mapping(bytes32 => mapping(address => Bond)) bonds;
        mapping (address => bool) initialized;
        address[] oracleList;//for traversing
    }
    
    Registry registry;
    ERC20 token;
    uint public decimals = 10**16;//dealing in units of 1/100 zap

    address marketAddress;
    address dispatchAddress;


    mapping(address=>Holder) holders;
    //(holder => (oracleAddress => (specifier => numEscrow)))
    mapping(address => mapping( address => mapping( bytes32 => uint256))) pendingEscrow;
    //(specifier=>(oracleAddress=>numZap)
    mapping(bytes32=>mapping(address=> uint)) public totalBound;


    modifier operatorOnly { if (msg.sender == marketAddress || msg.sender == dispatchAddress) _; }

    function Bondage(address tokenAddress, address registryAddress, address marketAddress){
        token = ERC20(tokenAddress);
        registry = Registry(registryAddress);
    }

    function setMarketAddress(address _marketAddress){
        if(marketAddress == 0){
            marketAddress = _marketAddress;            
        }
    }

    function setDispatchAddress(address _dispatchAddress){
        if(dispatchAddress == 0){
            dispatchAddress = _dispatchAddress;
        }
    }
    
    // Transfer N dots from fromAddress to destAddress called only by the DisptachContract or MarketContract
    // In smart contract endpoint, occurs per satisfied request, in socket endpoint called on termination of subscription 
    function transferDots(bytes32 specifier, address holderAddress, address oracleAddress, uint256 numDots) operatorOnly{
        
        if(numDots <= pendingEscrow[holderAddress][oracleAddress][specifier] ){
            
            pendingEscrow[holderAddress][oracleAddress][specifier] -= numDots;
            //if holder isnt initialized
            if(holders[oracleAddress]._address == 0){
                address[] oracleList;
                holders[oracleAddress] = Holder(oracleAddress, oracleList);  
            }
            
            if(!holders[oracleAddress].initialized[oracleAddress]){
                //initialize uninitialized holder
                holders[oracleAddress].initialized[oracleAddress] = true;
                holders[oracleAddress].oracleList.push(oracleAddress);
            }
    
            //if bond isnt initialized
            if(holders[oracleAddress].bonds[specifier][oracleAddress].numDots == 0){
                holders[oracleAddress].bonds[specifier][oracleAddress] = Bond(numDots, oracleAddress);
            }
            else{
                holders[oracleAddress].bonds[specifier][oracleAddress].numDots += numDots;
            }            
        }
    }
    
    function escrowDots(bytes32 specifier, address holderAddress, address oracleAddress, uint256 numDots) operatorOnly{
        
        uint currentDots = _getDots(specifier, holderAddress, oracleAddress);
        if(currentDots >= numDots){
            
            holders[holderAddress].bonds[specifier][oracleAddress].numDots-=numDots;
            pendingEscrow[holderAddress][oracleAddress][specifier]+=numDots;
        }
    }

    function redeemBond(
        bytes32 specifier, 
        uint numDots, 
        address oracleAddress){
        
        _redeemBond(
            specifier, 
            msg.sender,
            numDots,
            oracleAddress
        );       
    }

    function _redeemBond(
        bytes32 specifier, 
        address holderAddress, 
        uint numDots, 
        address oracleAddress) {

        uint currentDots = holders[holderAddress].bonds[specifier][oracleAddress].numDots;
        
        if( currentDots >= numDots){
        
            uint numZap = 0;
            uint localTotal = totalBound[specifier][oracleAddress];

            for(uint i=0; i<numDots; i++){
        
                totalBound[specifier][oracleAddress] -=1;
                holders[holderAddress].bonds[specifier][oracleAddress].numDots -=1;
                
                numZap += currentCostOfDot(
                        oracleAddress,
                        specifier,
                        localTotal
                    );
                
                localTotal -= 1;
            }
            token.transfer(holderAddress, numZap*decimals);
        }
    }

    function bond(
        bytes32 specifier, 
        uint numZap, 
        address oracleAddress){
        _bond(specifier, msg.sender, numZap, oracleAddress);        
    }

    function _bond(
        bytes32 specifier, 
        address holderAddress, 
        uint numZap, 
        address oracleAddress){

        if(holders[holderAddress]._address == 0){
            //initialize uninitialized holder
            address[] oracleList;
            holders[holderAddress] = Holder(holderAddress, oracleList);
        }
    
        if(!holders[holderAddress].initialized[oracleAddress]){
            //initialize uninitialized holder
            holders[holderAddress].initialized[oracleAddress] = true;
            holders[holderAddress].oracleList.push(oracleAddress);
        }
        
        uint numDots;
        (numZap, numDots) = calcZap(oracleAddress, specifier, numZap);

        //move zap user must have approved contract to transfer workingZap
        if(!token.transferFrom(msg.sender, this, numZap*decimals)){
            throw;
        }

        if(holders[holderAddress].bonds[specifier][oracleAddress].numDots == 0){
            //new bond
            holders[holderAddress].bonds[specifier][oracleAddress] = Bond(numDots, oracleAddress);
        }
        else{
            //increment bond                
            holders[holderAddress].bonds[specifier][oracleAddress].numDots += numDots;//change to zap
        }
        totalBound[specifier][oracleAddress] += numZap;
    }
  
    function calcZap(address oracleAddress, bytes32 specifier, uint256 numZap) returns(uint256 _numZap, uint256 _numDots){
        
        uint infinity=10;
        uint dotCost = 0;
        
        for(uint numDots=0; numDots < infinity; numDots++){
        
            dotCost = currentCostOfDot(
                oracleAddress, 
                specifier,
                (totalBound[specifier][oracleAddress] + numDots)
            );

            if(numZap > dotCost){
                numZap -= dotCost;           
            }
            else{
                return(numZap, numDots);                
            }
        }
    }
  
    function currentCostOfDot(
        address oracleAddress, 
        bytes32 specifier,
        uint totalBound) 
        internal returns(uint _cost){
        
        var (curveTypeIndex, curveStart, curveMultiplier) = registry.exportProviderCurve(oracleAddress, specifier);
        Registry.ZapCurveType curveType= Registry.ZapCurveType(curveTypeIndex);
        Registry.ZapCurve memory curve = Registry.ZapCurve(curveType, curveStart, curveMultiplier);        
        
        uint cost;
        if(curveType == Registry.ZapCurveType.ZapCurveNone){
            cost = 0;
        }
        else if(curveType == Registry.ZapCurveType.ZapCurveLinear){
        
            cost = curveMultiplier * totalBound + curveStart;
        }
        else if(curveType == Registry.ZapCurveType.ZapCurveExponential){
        
            cost = curveMultiplier* totalBound**2 + curveStart;            
        }
        else if(curveType == Registry.ZapCurveType.ZapCurveLogarithmic){
        
            if(totalBound == 0) totalBound=1;
            cost = curveMultiplier * log2(totalBound) + curveStart;
        }
        
        return cost;    
    }
  
  
    function getDots(bytes32 specifier, address oracleAddress) public returns(uint dots){
        return _getDots(specifier, msg.sender, oracleAddress);
    }
  
    function _getDots(bytes32 specifier, address holderAddress, address oracleAddress) returns(uint dots){
        
        return holders[holderAddress].bonds[specifier][oracleAddress].numDots;
    }

//SPECTIAL CURVES 

    function log2(uint x) returns (uint y){
       assembly {
            let arg := x
            x := sub(x,1)
            x := or(x, div(x, 0x02))
            x := or(x, div(x, 0x04))
            x := or(x, div(x, 0x10))
            x := or(x, div(x, 0x100))
            x := or(x, div(x, 0x10000))
            x := or(x, div(x, 0x100000000))
            x := or(x, div(x, 0x10000000000000000))
            x := or(x, div(x, 0x100000000000000000000000000000000))
            x := add(x, 1)
            let m := mload(0x40)
            mstore(m,           0xf8f9cbfae6cc78fbefe7cdc3a1793dfcf4f0e8bbd8cec470b6a28a7a5a3e1efd)
            mstore(add(m,0x20), 0xf5ecf1b3e9debc68e1d9cfabc5997135bfb7a7a3938b7b606b5b4b3f2f1f0ffe)
            mstore(add(m,0x40), 0xf6e4ed9ff2d6b458eadcdf97bd91692de2d4da8fd2d0ac50c6ae9a8272523616)
            mstore(add(m,0x60), 0xc8c0b887b0a8a4489c948c7f847c6125746c645c544c444038302820181008ff)
            mstore(add(m,0x80), 0xf7cae577eec2a03cf3bad76fb589591debb2dd67e0aa9834bea6925f6a4a2e0e)
            mstore(add(m,0xa0), 0xe39ed557db96902cd38ed14fad815115c786af479b7e83247363534337271707)
            mstore(add(m,0xc0), 0xc976c13bb96e881cb166a933a55e490d9d56952b8d4e801485467d2362422606)
            mstore(add(m,0xe0), 0x753a6d1b65325d0c552a4d1345224105391a310b29122104190a110309020100)
            mstore(0x40, add(m, 0x100))
            let magic := 0x818283848586878898a8b8c8d8e8f929395969799a9b9d9e9faaeb6bedeeff
            let shift := 0x100000000000000000000000000000000000000000000000000000000000000
            let a := div(mul(x, magic), shift)
            y := div(mload(add(m,sub(255,a))), shift)
            y := add(y, mul(256, gt(arg, 0x8000000000000000000000000000000000000000000000000000000000000000)))
        }  
    }
}
