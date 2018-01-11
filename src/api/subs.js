
module.exports = function(args){
    const sub = require("./subscriber.js");
    new sub("0x732a5496383DE6A55AE2Acc8829BE7eCE0833113", args, (data) => {
        console.log("DATA:   ", data);
    });
};
