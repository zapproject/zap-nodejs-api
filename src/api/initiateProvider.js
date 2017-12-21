module.exports = function(args) {
    const SynapseProvider = require('./provider')
    const callback = require('../feeds/'+args.callback)

    new SynapseProvider(args.groupName ? args.groupName : null,
        args.weiRate ? args.weiRate : null,
        args.fileName ? args.fileName : null ,
        args.action, callback);
}
