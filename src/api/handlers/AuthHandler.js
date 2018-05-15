class AuthHandler {
    constructor() {
        this.isAuthHandler = true;
        this.isLoggedIn = false;
    }

    async login(options) {
        this.isLoggedIn = true;
    }

    async onAuthError(options) {}
}

module.exports = AuthHandler;