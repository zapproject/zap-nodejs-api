first do
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
