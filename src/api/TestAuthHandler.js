const AuthHandler = require('./handlers/AuthHandler');

class TestAuthHandler extends AuthHandler {
    constructor() {
        super();
    }

    async login(options) {
        await super.login(options);
        return options;
    }

    async onAuthError(options) {
        return options;
    }
}

module.exports = TestAuthHandler;