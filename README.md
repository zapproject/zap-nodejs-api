### Zap SDK development 

![ZAP DFD](https://github.com/zapproject/FeedArbitration/blob/master/dataflow.png)

### Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

### tests

to run tests you should clone this project with sub - modules
#### to newest clone project 

> git clone --recurse-submodules -j8 https://github.com/zapproject/FeedArbitration.git

#### for already cloned repository 

> git clone https://github.com/zapproject/FeedArbitration.git

> cd FeedArbitration

> git submodule update --init --recursive

##### then run command 
```javascript 
yarn install
```

##### for run test
``` javascript
yarn test
```

now our tests unstable in `master` branch

to switch another branch use the following commands
> cd ZapContracts

> git checkout registry_and_bondage_tests

> cd  ../


