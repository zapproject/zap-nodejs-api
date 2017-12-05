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
zapcli new -p 'group name' 'wei rate'
```
Example:
```
zapcli new -p abc 1
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
### Create Account

Open another terminal and go to the directory "/src/api" and type the following command

```
node newAccount.js
```
The above command will create a new account and ask for password to encrypt the private key of account created. The resulting ciphered text will be stored in file currently named '.account'



### Load Account
It will load the account from file '.account' which we created in the last step and ask for password. It will be later converted to load account from file that we provide it as argument.
```
node loadAccount.js
```
