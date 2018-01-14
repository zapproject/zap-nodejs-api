
Experimental alpha in development


```
npm install
```
### Setup CLI

The following command will create a global npm package for you by the name 'zapcli'
```
sudo npm install -g
```

### Create Account


```
zapcli new -a
```
### Load Account

```
zapcli load -a 'filename'
```
filename starting with '.' will be generated in the directory src/api.
### Run provider


```
zapcli new -p 'group name' 'wei rate' 'callback file name'
```
Example:
```
zapcli new -p abc 1 testCallback
```
To load provider use
```
zapcli load -p filename
```


### Run Subscriber

1 - Copy this output console snippet from the terminal where provider is running.
"Swarm listening on /ip4/127.0.0.1/tcp/4003/ws/ipfs/QmT9xvwLVR1GbHKj83YWcrZnrxo4bJ9cQ4jb35QcrSeSJA"
and paste the address inside this snippet to subscription1.js where you provide it as an argument to the function 'ipfs.swarm.connect'

2 - Open another terminal window


```
zapcli new -s 'group_name'
```
Example:

```
zapcli new -s abc
```
To load subscriber
```
zapcli load -s filename
```

### Set RPC HOST
```
zapcli set --rpc 'rpc host'
```
Example:

```
zapcli set --rpc https://rinkeby.infura.io
```

### Set WS HOST
```
zapcli set --ws 'ws host'
```
Example:
```
zapcli set --ws ws://dendritic.network:8546
```
### Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

### License

This code is released under GPL v.3.
```
                                          .───────────.
┌─────────────────────────────────────▶ ,'             `.
│  ┌──────────────────────────────────▶(   Subscriber    )                                     ┌────────────────────┐
│  │                                    '─.           ,─'                                      │ Zap Token Contract │
│  │                                       `─────────'                            Spends ZAP   │                    │
│  │                                            │                               ┌─────────────▶│   - ERC20 token    │
│  │                                   Requests │                               │              │                    │
│  │                                   registry │                               │              └────────────────────┘
│  │                                   contract │                               │                         ▲
│  │                                            │                               │               Sent ZAP to eachother
│  │                                            ▼                               │                         ▼
│  │                           ┌─────────────────────────────────┐              │              ┌────────────────────┐   Queries
│  │                           │        Arbiter Contract         │◀─────────────┘  Spends DOT  │  Bondage Contract  │    curve
│  │                           │                                 │◀─────────────┐   balances   │                    │ information
│  │                  Points to│   Responsible for initiating    │              └──────────────┤Stores bound Zap and│   on bond
│  │                   ┌───────│subscriptions and alerting either│─────┐                       │ DOT balances (not  │────────────┐
│  │                   │       │  the provider or the dispatch   │     │                       │     sendable)      │            │
│  │ Sends             │       │ contract of the newly initiated │ Points to         Comm.  ┌─▶│  Escrows DOT for   │            │
│  │provider           │       └─────────────────────────────────┘     │             Escrow │  │   subscriptions    │            │
│  │  info             ▼                        │                      ▼              info  │  └────────────────────┘            │
│  │  ┌────────────────────────────────┐        │   ┌────────────────────────────────────┐◀─┘                                    │
│  │  │       Registry Contract        │Listens │   │         Dispatch Contract          │              ┌─────────────────┐      │
│  │  │                                │for sub │   │                                    │   Forwards   │                 │      │
│  └──│  Registry of all the oracles,  │  info  │   │ Location where providers send data │   data to    │ User Contracts  │      │
│     │    their rates, and related    │        │   │    to be forwarded to the user     │─────────────▶│                 │      │
│     │    contact/DOT information     │     ┌──┘   │             contracts              │    Requests  │                 │      │
│     └────────────────────────────────┘     │      │ Controls the escrow in the Bondage │      Data    └─────────────────┘      │
│                      ▲                     │      │              contract              │◀─────────────                         │
│                      │                     │      └────────────────────────────────────┘                                       │
│                      └─────────────────────┼───────────────────────────────────────────────────────────────────────────────────┘
│                                            │                         │
│                                            │                         │
│                                            ▼          Send smart     │
│                              Sends     .───────.     contract data   │
│                              socket  ,'         `.  and listens for  │
│                               data  ;  Providers  :  data requests   │
└─────────────────────────────────────:             ;──────────────────┘
                                       ╲           ╱
                                        `.       ,'
                                          `─────'
```
