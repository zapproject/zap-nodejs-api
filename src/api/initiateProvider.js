module.exports = function(args) {
    const ZapProvider = require('./provider')
    const callback = require('../feeds/'+args.callback)

    new ZapProvider(args.groupName ? args.groupName : null,
        args.weiRate ? args.weiRate : null,
        args.fileName ? args.fileName : null ,
        args.action, callback);
}
