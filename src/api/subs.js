
module.exports = function(args){
const sub = require("./subscriber.js")
const sub1 = new sub("0x732a5496383DE6A55AE2Acc8829BE7eCE0833113", args, () => {
        console.log("data in the callback")
    })
  }