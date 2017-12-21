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

contract Bondage{
    
    struct Holder{
        address _address;//holder address
        mapping(address => Bond) bonds;//oracle address to bond
        address[] oracleList;//for traversing
    }
    
    struct Bond{
        uint numZap;
        address oracle;
    }
    
    //todo check total bond >= balanceOf
    struct Oracle{
        uint startRate;
        uint totalBond;
        uint priceCurve;
        address _address;
        string title;
    }
    
    mapping(address => Holder) holders;
    mapping(address => Oracle) oracles;
    
    address[] holderList;
    address[] oracleList;
    
    
    ERC20 token; 
    uint public decimals = 10**18; 
    
    function Bondage(address tokenAddress){
        token = ERC20(tokenAddress);
    }
    
    event ShowBond(uint numZap, address oracle, uint totalBond, uint priceCurve, string title);
    event ShowOracle(uint startRate, address _address, uint totalBond, uint priceCurve, string title);
    
/*
TODO actually move zap
"0xca35b7d915458ef540ade6068dfe2f44e8fa733c",1,"0xCF323e741a82fB8eb37B3B260A9C4907237A532A"
"0x583031d1113ad414f02576bd6afabfb302140225",2"0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db"
*/
event StepThrough(uint step, string desc);

    
    function addBond(address holderAddress, uint _numZap, address _oracleAddress){
StepThrough(0, toString(holders[holderAddress]._address));
    
    //not enough zap
    if(_numZap < oracles[_oracleAddress].startRate || token.balanceOf(msg.sender) < (_numZap*decimals )){
        throw;
    }
    //if transfer fails throw. prob because bondage contract not approved to move numZap
    if(!token.transferFrom(msg.sender, this, _numZap)){
        throw;
    }

    if(holders[holderAddress]._address == 0){
StepThrough(0,"new holder");
            //new holder
            addHolder(holderAddress, _numZap, _oracleAddress);
        }
        else{
StepThrough(1,"old holder");
            if(holders[holderAddress].bonds[_oracleAddress].numZap == 0){
StepThrough(2,"first bond to oracle address");
                //first bond to oracleAddress
                holders[holderAddress].bonds[_oracleAddress] =  Bond(_numZap, _oracleAddress);
                holders[holderAddress].oracleList.push(_oracleAddress);
            }
            else{
StepThrough(3,"increment holder");
                holders[holderAddress].bonds[_oracleAddress].numZap += _numZap;//change to zap
            }
        }
        oracles[_oracleAddress].totalBond += _numZap;
        
    }
    
    function unbond(uint numDots, address _oracleAddress){
        redeemBond(msg.sender, numDots, _oracleAddress);
    }
    
    function redeemBond(address holderAddress, uint numDots, address _oracleAddress){

        uint currentDots = getDots(holderAddress, _oracleAddress);//zap per dot
        uint zap = 0;
        if( currentDots >= numDots){
            for(uint i=0; i<numDots; i++){
              //uint rate = getRate(oracles[_oracleAddress].totalBond, oracles[_oracleAddress].priceCurve);
              zap += updateCostOfToken(oracles[_oracleAddress].totalBond, oracles[_oracleAddress].startRate);
              oracles[_oracleAddress].totalBond -= 1;
              holders[holderAddress].bonds[_oracleAddress].numZap -=1;
            }
            token.transfer(holderAddress, zap);
        }
    }

    function getDots(address holderAddress, address _oracleAddress) returns(uint dots){
        StepThrough(oracles[_oracleAddress].totalBond, "oracle.totalBond");
        StepThrough(oracles[_oracleAddress].startRate, "oracle.startRate");
        uint cost = updateCostOfToken(oracles[_oracleAddress].totalBond, oracles[_oracleAddress].startRate);//zap per dot
        
        return holders[holderAddress].bonds[_oracleAddress].numZap / cost;
    }
    
    function addHolder(address _address, uint _numZap, address _oracleAddress){
        //StepThrough(0,"add holder");
        if(holders[_address].bonds[_oracleAddress].numZap == 0){
        //new holder
            address[] oracleList;
            holders[_address] = Holder(_address,oracleList);
            holders[_address].bonds[_oracleAddress] = Bond(_numZap, _oracleAddress);
            holders[_address].oracleList.push(_oracleAddress);
            holderList.push(_address);//change to msg.sender
        }
        //holder exists 
    }
    
/*
1, 2,341234,"0xCF323e741a82fB8eb37B3B260A9C4907237A532A","PoliticalAction"
5, 2,141234,"0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db","SportsNow"
*/
    function addOracle(uint _startRate, uint _totalBond, uint _priceCurve, address _address, string _title){
        oracles[_address] = Oracle(_startRate, _totalBond, _priceCurve, _address, _title);        
        oracleList.push(_address);
    }
    
    function getNumBonds(address _address) returns (uint _length) {
//        StepThrough(holders[_address].oracleList.length, 'length of oracleList');
        return holders[_address].oracleList.length;
    }
    
    function getNumBondsUser() returns(uint _length){
        return getNumBonds(msg.sender);
    }
    
    function getUserBondByIndex(uint index){
        getBondByIndex(msg.sender, index);
    }
    
    function getBondByIndex(address holderAddress, uint index){
        address oracleAddress= holders[holderAddress].oracleList[index];
        Bond bond = holders[holderAddress].bonds[oracleAddress];
        Oracle oracle = oracles[bond.oracle];
        ShowBond(bond.numZap, bond.oracle, oracle.totalBond, oracle.priceCurve, oracle.title);
    }
     
    function getOracle(address _address){
        Oracle oracle = oracles[_address];
        ShowOracle(oracle.startRate, oracle._address, oracle.totalBond, oracle.priceCurve, oracle.title);
    }
    
    function getBondByOracleAddress(address holderAddress, address oracleAddress){
        Bond memory bond = holders[holderAddress].bonds[oracleAddress];
        Oracle memory oracle = oracles[oracleAddress];
        ShowBond(bond.numZap, bond.oracle, oracle.totalBond, oracle.priceCurve, oracle.title);
    }

    // via: http://ethereum.stackexchange.com/questions/10425/is-there-any-efficient-way-to-compute-the-exponentiation-of-a-fraction-and-an-in/10432#10432
    // Computes `k * (1+1/q) ^ N`, with precision `p`. The higher
    // the precision, the higher the gas cost. It should be
    // something around the log of `n`. When `p == n`, the
    // precision is absolute (sans possible integer overflows).
    // Much smaller values are sufficient to get a great approximation.
    function fracExp(uint k, uint q, uint n, uint p) internal returns (uint) {
      uint s = 0;
      uint N = 1;
      uint B = 1;
      for (uint i = 0; i < p; ++i){
        s += k * N / B / (q**i);
        N  = N * (n-i);
        B  = B * (i+1);
      }
      return s;
    }

    function updateCostOfToken(uint256 _supply, uint256 baseCost) internal returns(uint _costPerToken) {
        //from protocol design:
        //costOfCoupon = (BaseCost + BaseCost*(1.000001618^AvailableSupply)+BaseCost*AvailableSupply/1000)
        //totalSupply == AvailableSupply
        StepThrough(baseCost, "baseCost");
        StepThrough(_supply, "_supply");
        uint costPerToken = baseCost+fracExp(baseCost, 618046, _supply, 2)+baseCost*_supply/1000;
        return costPerToken;
    }
    
    function toString(address x) returns (string) {
    bytes memory b = new bytes(20);
    for (uint i = 0; i < 20; i++)
        b[i] = byte(uint8(uint(x) / (2**(8*(19 - i)))));
    return string(b);
}

    function toBytes(address a) constant returns (bytes b){
        assembly {
            let m := mload(0x40)
            mstore(add(m, 20), xor(0x140000000000000000000000000000000000000000, a))
            mstore(0x40, add(m, 52))
            b := m
        }
    }

}
