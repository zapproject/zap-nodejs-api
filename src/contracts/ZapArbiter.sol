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

    function setMarketAddress(address _marketAddress);

    function setDispatchAddress(address _dispatchAddress);
    
    // Transfer N dots from fromAddress to destAddress called only by the DisptachContract or MarketContract
    // In smart contract endpoint, occurs per satisfied request, in socket endpoint called on termination of subscription 
    function transferDots(bytes32 specifier, address holderAddress, address oracleAddress, uint256 numDots) ;

    function escrowDots(bytes32 specifier, address holderAddress, address oracleAddress, uint256 numDots) ;

    function redeemBond(
        bytes32 specifier, 
        uint numDots, 
        address oracleAddress);

    function _redeemBond(
        bytes32 specifier, 
        address holderAddress, 
        uint numDots, 
        address oracleAddress);

    function bond(
        bytes32 specifier, 
        uint numZap, 
        address oracleAddress);

    function _bond(
        bytes32 specifier, 
        address holderAddress, 
        uint numZap, 
        address oracleAddress);
  
    function calcZap(address oracleAddress, bytes32 specifier, uint256 numZap) returns(uint256 _numZap, uint256 _numDots);
  
    function currentCostOfDot(
        address oracleAddress, 
        bytes32 specifier,
        uint totalBound) 
        internal returns(uint _cost);
  
    function getDots(bytes32 specifier, address oracleAddress) public returns(uint dots);
    
    function _getDots(bytes32 specifier, address holderAddress, address oracleAddress) returns(uint dots);

}

contract ZapAribiter{
    
    // Called when a data purchase is initiated
    event ZapDataPurchase(
        address provider_address,       // Etheruem address of the provider
        address subscriber,     // Ethereum address of the subscriber
        uint256 public_key,     // Public key of the subscriber
        uint256 amount,         // Amount (in 1/100 zap) of ethereum sent
        bytes32[] endpoint_params,       // Endpoint specific( nonce,encrypted_uuid),
        bytes32 enpoint
    );

    enum ZapSubscriptionTerminator {
        ZapTermProvider,
        ZapTermSubscriber
    }

    // Called when a data subscription is ended by either provider or terminator
    event ZapDataSubscriptionEnd(
        address provider,   // Provider from the subscription
        address subsriber,  // Subscriber from the subscription
        ZapSubscriptionTerminator terminator // Which terminated the contract
    );

    // Each subscription is represented as the following
    struct ZapSubscription {
        uint dots;     // Cost in dots
        uint blockstart;    // Block number subscription was initiated
        uint preblockend;   // Precalculated block end
    }
    
    uint decimals = 10**16; // 1/100th of zap
    
    Bondage bondage;
    Registry registry;
    
    //provider_address=> ( subscriber_address => (endpoint => ZapSubscription)
    mapping(address=>mapping(address=>mapping(bytes32=>ZapSubscription))) subscriptions;
    
    
    function ZapAribiter(address _bondageAddress, address _registryAddress){
        Registry registry = Registry(_registryAddress);
        Bondage bondage = Bondage(_bondageAddress);
    }
    
    function initiateSubscription( 
                                address provider_address, // Provider address
                                bytes32[] endpoint_params,// Endpoint specific params
                                bytes32 endpoint,         // Endpoint specifier
                                uint256 public_key,       // Public key of the purchaser
                                uint256 blocks            // Number of blocks subscribed, 1block=1dot
        ){
        
        require(blocks > 0);

        bondage.escrowDots(endpoint, msg.sender, provider_address, blocks);

        //TODO test if null subscription
        subscriptions[provider_address][msg.sender][endpoint] = ZapSubscription({
            dots:blocks,
            blockstart:block.number,
            preblockend: block.number + blocks
        });
        
        // Emit the event
        ZapDataPurchase(provider_address, 
                        msg.sender, 
                        public_key, 
                        blocks, 
                        endpoint_params,
                        endpoint);

    }
    
    // Finish the data feed
    function endZapSubscription(bytes32 endpoint,
                                address provider_address,
                                address subscriber_address)
                                    internal
                                    returns (bool) {

        ZapSubscription storage subscription = subscriptions[provider_address][subscriber_address][endpoint];
        
        // Make sure the subscriber has a subscription
        if(subscription.dots == 0){
            throw;
        }

        //subscription ended early
        if(block.number < subscription.preblockend){
            
            uint256 earnedDots = (block.number * subscription.dots) / subscription.preblockend;
            uint256 returnedDots = subscription.dots - earnedDots;
            
            bondage.transferDots(endpoint, subscriber_address, provider_address, earnedDots);
            bondage.transferDots(endpoint, subscriber_address, subscriber_address, returnedDots);
            
        }
        else{
            bondage.transferDots(endpoint, subscriber_address, provider_address, subscription.dots);
        }
        
        // Kill the subscription
        subscription.dots = 0;        

        return true;
    }

    // Finish the data feed from the provider
    function endZapSubscription_Provider(bytes32 endpoint,
                                         address subscriber_address,
                                         address provider_address
                                             ) {
        // Emit an event on success about who ended the contract
        if ( endZapSubscription(endpoint, provider_address, subscriber_address) ) {
            ZapDataSubscriptionEnd(msg.sender, subscriber_address, ZapSubscriptionTerminator.ZapTermProvider);
        }
    }

    // Finish the data feed from the provider
    function endZapSubscription_Subscriber(bytes32 endpoint,
                                         address subscriber_address,
                                         address provider_address
                                             ) {
        // Emit an event on success about who ended the contract
        if ( endZapSubscription(endpoint, provider_address, subscriber_address) ) {
            ZapDataSubscriptionEnd(provider_address, msg.sender, ZapSubscriptionTerminator.ZapTermProvider);
        }
    }
    
}
