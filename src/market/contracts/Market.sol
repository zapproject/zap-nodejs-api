pragma solidity ^0.4.14;
import "../token/contracts/SynToken.sol";

// Contract representing the Synase market place
contract SynapseMarket {
    address adminAddress;
    SynToken public syn;
    
    enum SynapseDataTypes {
        SynapseDataHistory, // Historical data
        SynapseDataStream,  // Real time data feed
        SynapseDataSnapshot // Snapshot data
    }

    enum SynapseSubscriptionTerminator {
        SynapseTermProvider,
        SynapseTermSubscriber
    }

    // Called when a data provider is found
    event SynapseProviderFound(
        uint256 index // Index in the addresses array of where the provider is
    );

    // Called when a data purchase is initiated
    event SynapseDataPurchase(
        address provider,       // Etheruem address of the provider
        address subscriber,     // Ethereum address of the subscriber
        uint256 public_key,     // Public key of the subscriber
        uint256 amount,         // Amount (in wei) of ethereum sent
        bytes32 encrypted_uuid, // UUID encrypd with public key of the provider
        bytes32 nonce           // Nonce for the encryption routine
    );

    // Called when a data subscription is ended by either provider or terminator
    event SynapseDataSubscriptionEnd(
        address provider,   // Provider from the subscription
        address subsriber,  // Subscriber from the subscription
        SynapseSubscriptionTerminator terminator // Which terminated the contract
    );
    
    event TransferFailed( 
      address sender
    );

    // Each subscription is represented as the following
    struct SynapseSubscription {
        uint256 amount;     // Amount of data involved
        uint blockstart;    // Block number subscription was initiated
        uint preblockend;   // Precalculated block end
    }

    // Each provider is allcoated a structure that contains their address and their public key
    struct SynapseProvider {
        address user;       // User address to deposit money into
        uint256 public_key; // Public key of the user
        int256 reputation;  // The user's current reputation
        uint256 wei_rate;   // Current amount of wei per block
        mapping(address => SynapseSubscription) subscriptions; // A mapping of subscriber addresses to subscription objects
    }

    // SynapseProviderGroups are a structure representing groupings of providers with a common data feed
    struct SynapseProviderGroup {
        SynapseDataTypes datatype;                     // The type of data they are distributing (history, stream, snapshot)
        address[] provider_addresses;                  // A list of their providres
        uint256 index;                                 // The current index within their providers
        mapping(address => SynapseProvider) providers; // A map to determine addresses already registered
    }

    // Map basic names (32 byte names) to provider data
    mapping(bytes32 => SynapseProviderGroup) providerGroups;

    // Current mapping of available wei for payout
    mapping(address => uint256) availablePayouts;

    function SynapseMarket() {
        adminAddress = msg.sender;
    }

    // When a provider asks to be registered, register them.
    function registerSynapseProvider(bytes32 group,
                                     uint256 public_key,
                                     uint256 wei_rate) {
        // Find the provider group
        SynapseProviderGroup storage providerGroup = providerGroups[group];

        // Make sure we haven't used this address before
        require( providerGroup.providers[msg.sender].user != msg.sender );

        // Mark the address as used
        providerGroup.providers[msg.sender] = SynapseProvider({
            public_key: public_key,
            user: msg.sender,
            reputation: 0,
            wei_rate: wei_rate
        });

        // Add the user
        providerGroup.provider_addresses.push(msg.sender);
    }

    // If someone requsts a provider, find one and give them one
    function requestSynapseProvider(bytes32 group) {
        // Find the provider group
        SynapseProviderGroup storage providerGroup = providerGroups[group];

        // Make sure we have providers
        require(providerGroup.provider_addresses.length != 0);

        // Get a provider
        uint256 index = providerGroup.index++;

        // Roll around the length of the provider group to make sure no overflows
        providerGroup.index = providerGroup.index % providerGroup.provider_addresses.length;

        // Return the relevant information
        SynapseProviderFound(index);
    }

    // Initiate a data feed with a given provider and emit necessary events
    function initSynapseDataFeed(bytes32 group,            // Group of the user for validation
                                 address provider_address, // Provider address
                                 uint256 public_key,       // Public key of the purchaser
                                 bytes32 encrypted_uuid,   // Encrypted UUID with the provider's public key
                                 bytes32 nonce,
                                 uint256 payment
                                 )            // Nonce for the encryption routine
                                 payable {
        // Find the provider group
        SynapseProviderGroup storage providerGroup = providerGroups[group];

        // Find the provider
        SynapseProvider storage provider = providerGroup.providers[provider_address];

        // Make sure the provider is real, and not himself
        require( provider.user == provider_address && provider.user != msg.sender );

        // Make sure hes not trying to do more than one subscription at a time
        require( provider.subscriptions[msg.sender].amount == 0 );

        //Make sure syn balance > 0
        require( syn.balanceOf(msg.sender) >= payment );

        // Calculate amount of blocks based on amount sent, rounding down
        uint256 blockcount = payment / provider.wei_rate;
        
        //uint256 blockcount = msg.value / provider.wei_rate;
        require(blockcount > 0);
        
        //approve market to transfer
        syn.approve(this, payment);
        
        if(!syn.transferFrom(msg.sender, this, payment)){
            // Emit the event
            TransferFailed(msg.sender);
            throw;
        }            
        // Add the subscription to the prvider
        provider.subscriptions[msg.sender] = SynapseSubscription({
            amount: payment,
            blockstart: block.number,
            preblockend: block.number + blockcount
        });

        // Emit the event
        SynapseDataPurchase(provider_address, msg.sender, public_key, msg.value, encrypted_uuid, nonce);
    }

    // Finish the data feed
    function endSynapseSubscription(bytes32 group,
                                    address provider_address,
                                    address subscriber_address)
                                    internal
                                    returns (bool) {
        // Find the provider group
        SynapseProviderGroup storage providerGroup = providerGroups[group];

        // Find the provider
        SynapseProvider storage provider = providerGroup.providers[provider_address];

        // Make sure provider exists
        require( provider.user == provider_address );

        // Find the subscription
        SynapseSubscription storage subscription = provider.subscriptions[subscriber_address];

        // Make sure the subscriber has a subscription
        if  ( subscription.amount == 0 ) {
            return false;
        }

        // The subscription has ended before its time.
        if ( block.number < subscription.preblockend ) {
            // Calculated the earned way as a percentage of the original wei, and the amount returned as the difference
            uint256 earnedWei = (block.number * subscription.amount) / subscription.preblockend;
            uint256 returnedWei = subscription.amount - earnedWei;
            
            // Kill the subscription
            subscription.amount = 0;

            // Add the payouts
            availablePayouts[provider_address] += earnedWei;
            availablePayouts[subscriber_address] += returnedWei;
        }
        else {
            // The subscription is done. Add the payout and kill the subscription
            availablePayouts[provider_address] += subscription.amount;
            subscription.amount = 0;
        }

        return true;
    }

    // Finish the data feed from the provider
    function endSynapseSubscription_Provider(bytes32 group,
                                             address subscriber_address) {
        // Emit an event on success about who ended the contract
        if ( endSynapseSubscription(group, msg.sender, subscriber_address) ) {
            SynapseDataSubscriptionEnd(msg.sender, subscriber_address, SynapseSubscriptionTerminator.SynapseTermProvider);
        }
    }

    // Finish the data feed from the subscriber
    function endSynapseSubscription_Subscriber(bytes32 group,
                                               address provider_address) {
        // Emit an event on success about who ended the contract
        if ( endSynapseSubscription(group, provider_address, msg.sender) ) {
            SynapseDataSubscriptionEnd(provider_address, msg.sender, SynapseSubscriptionTerminator.SynapseTermSubscriber);
        }
    }

    // Withdraw funds currently held in the contract
    function withdraw() returns (bool) {
        // Make sure the user has funds
        uint256 amount = availablePayouts[msg.sender];
        require(amount > 0);

        // Empty his counter
        availablePayouts[msg.sender] = 0;
        
        //approve market to transfer
        syn.approve(this, amount);
        
        // Send the funds to his wallet
        if ( !syn.transferFrom(this, msg.sender, amount) ) {
            // Give him back the funds if it fails to send
            availablePayouts[msg.sender] += amount;
            TransferFailed(msg.sender);
            return false;
        }

        return true;
    }

    // Get the amount of providers in a group
    function getProviderCount(bytes32 group)
                              constant
                              returns (uint256) {
        return providerGroups[group].provider_addresses.length;
    }

    // Get provider N's wei rate
    function getProviderRate(bytes32 group,
                             uint256 index)
                             constant
                             returns (uint256) {
        // Get the provider group
        SynapseProviderGroup storage providerGroup = providerGroups[group];

        // Make sure we're not going out of bounds
        require ( index < providerGroup.provider_addresses.length );

        // Get the address of the provider
        address providerAddress = providerGroup.provider_addresses[index];

        // Get the wei rate
        return providerGroup.providers[providerAddress].wei_rate;
    }

    // Get provider N's address
    function getProviderAddress(bytes32 group,
                                uint256 index)
                                constant
                                returns (address) {
        // Get the provider group
        SynapseProviderGroup storage providerGroup = providerGroups[group];

        // Make sure we're not going out of bounds
        require ( index < providerGroup.provider_addresses.length );

        // Get the address of the provider
        address providerAddress = providerGroup.provider_addresses[index];

        return providerAddress;
    }

    // Get provider N's public key
    function getProviderPublic(bytes32 group,
                               uint256 index)
                               constant
                               returns (uint256) {
        // Get the provider group
        SynapseProviderGroup storage providerGroup = providerGroups[group];

        // Make sure we're not going out of bounds
        require ( index < providerGroup.provider_addresses.length );

        // Get the address of the provider
        address providerAddress = providerGroup.provider_addresses[index];

        // Get the public key
        return providerGroup.providers[providerAddress].public_key;
    }

    // Get provider N's rating
    function getProviderRating(bytes32 group,
                               uint256 index)
                               constant
                               returns (int256) {
        // Get the provider group
        SynapseProviderGroup storage providerGroup = providerGroups[group];

        // Make sure we're not going out of bounds
        require ( index < providerGroup.provider_addresses.length );

        // Get the address of the provider
        address providerAddress = providerGroup.provider_addresses[index];

        // Get the public key
        return providerGroup.providers[providerAddress].reputation;
    }
}
