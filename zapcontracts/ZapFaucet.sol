contract Token {
    function transfer(address _to, uint256 _amount) returns (bool);
    function balanceOf(address _addr) constant returns (uint256 bal);
}
contract ZapFaucet {
    Token token;
    uint256 amt;
    address owner;

    function ZapFaucet(address _token, uint256 _amt) {
        token = Token(_token);
        amt = _amt;
        owner = msg.sender;
    }
  function getZap() {
      token.transfer(msg.sender, amt);
  }
  
  function returnZap(){
      if (owner != msg.sender) revert();
      token.transfer(owner, token.balanceOf(this));
  }
  
  function changeAmount(uint256 _amt) {
      if (owner != msg.sender) revert();
      amt = _amt;
  }
}