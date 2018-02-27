### Zap SDK development 

![ZAP DFD](https://github.com/zapproject/FeedArbitration/blob/master/dataflow.png)

### Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

### Tests
    git clone --recurse-submodules -j8 https://github.com/zapproject/FeedArbitration.git

    git submodule update --init --recursive


  #### then run command
    yarn install


  #### for run test with coveralls.io
    yarn run test

  #### for run test locally
    yarn run test_local

  #### for code coverage
    yarn run coverage
