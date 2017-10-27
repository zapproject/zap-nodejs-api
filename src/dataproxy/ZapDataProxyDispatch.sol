library SafeMath {
    function mul(uint256 a, uint256 b) internal constant returns (uint256) {
        uint256 c = a * b;
        assert(a == 0 || c / a == b);
        return c;
    }
    function div(uint256 a, uint256 b) internal constant returns (uint256) {
        // assert(b > 0); // Solidity automatically throws when dividing by 0
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold
        return c;
    }
    function sub(uint256 a, uint256 b) internal constant returns (uint256) {
        assert(b <= a);
        return a - b;
    }
    function add(uint256 a, uint256 b) internal constant returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}

contract Token {
    function transferFrom(address a, address b, uint256 amt) returns (bool);
    function transfer(address b, uint256 amt) returns (bool);
    function balanceOf(address _owner) constant returns (uint256 balance);
}

contract Client1 {
    function __zapCallback(uint256 id, string _response1);
}
contract Client2 {
    function __zapCallback(uint256 id, string _response1, string _response2);
}
contract Client3 {
    function __zapCallback(uint256 id, string _response1, string _response2, string _response3);
}
contract Client4 {
    function __zapCallback(uint256 id, string _response1, string _response2, string _response3, string _response4);
}

contract ZapDataProxyDispatch {
    Token token;
    uint256 public tokenCost;
    using SafeMath for uint256;

    address owner;

    modifier owneronly { if (msg.sender == owner) _; }
    event Incoming(uint256 id, address recipient, string query, uint256 tokensPaid);
    enum Status { Pending, Refunded, Fulfilled }
    struct Query {
        address subscriber;
        address provider;
        address user;
        uint256 tokensPaid;
        Status status;
    }
    mapping (uint256 => Query) queries;
    mapping (address => uint256) balance;

    function ZapDataProxyDispatch(address _addr) {
        token = Token(_addr);
        owner = msg.sender;
    }

    function setCost(uint256 _tokenCost) owneronly public {
        tokenCost = _tokenCost;
    }

    function depositToken(uint256 _amt) public returns (bool success) {
        token.transferFrom(msg.sender, this, _amt);
        balance[msg.sender] += _amt;
        return true;
    }

    function withdrawToken(address _user, uint256 _amt) public returns (bool success) {
        token.transfer(_user, _amt);
        balance[_user] = balance[_user].sub(_amt);
        return true;
    }

    function query(address _provider, string _query, address _user, uint256 _tokensPaid) external returns (uint256 id) {
        id = uint256(sha3(block.number, now, _query, msg.sender));
        //id = block.number;
        queries[id] = Query(msg.sender, _provider, _user, _tokensPaid, Status.Pending);
        Incoming(id, msg.sender, _query, _tokensPaid);
    }

    function cancelQuery(uint256 id) {
        if (queries[id].provider != msg.sender || queries[id].subscriber != msg.sender)
            revert();
        queries[id].status = Status.Refunded;
    }

    function fulfillQuery(uint256 id) internal returns (bool) {
        if (tokenCost > queries[id].tokensPaid || queries[id].status != Status.Pending)
            revert();
        if (tokenCost > 0) {
            balance[queries[id].user] = balance[queries[id].user].sub(tokenCost);
            queries[id].tokensPaid = queries[id].tokensPaid.sub(tokenCost);
            token.transfer(queries[id].provider, tokenCost);
        }
        queries[id].status = Status.Fulfilled;
        return true;
    }

    function respond1(uint256 id, string _response) {
        if (queries[id].provider != msg.sender || !fulfillQuery(id))
            revert();
        Client1(queries[id].subscriber).__zapCallback(id, _response);
    }

    function respond2(uint256 id, string _response1, string _response2) external returns (bool) {
        if (queries[id].provider != msg.sender || !fulfillQuery(id))
            revert();
        Client2(queries[id].subscriber).__zapCallback(id, _response1, _response2);
    }

    function respond3(uint256 id, string _response1, string _response2, string _response3) external returns (bool) {
        if (queries[id].provider != msg.sender || !fulfillQuery(id))
            revert();
        Client3(queries[id].subscriber).__zapCallback(id, _response1, _response2, _response3);
    }
    
    function respond4(uint256 id, string _response1, string _response2, string _response3, string _response4) external returns (bool) {
        if (queries[id].provider != msg.sender || !fulfillQuery(id))
            revert();
        Client4(queries[id].subscriber).__zapCallback(id, _response1, _response2, _response3, _response4);
    }
    
    function getTokenBalance () constant returns (uint256 bal) {
        return token.balanceOf(this);
    }

    function setOwner(address _owner) owneronly {
        owner = _owner;
    }

    function transfer(uint value) owneronly {
        transfer(msg.sender, value);
    }

    function transfer(address _to, uint value) owneronly {
        _to.send(value);
    }

    function kill() owneronly {
        suicide(msg.sender);
    }
}
