const Provider = require('./components/Provider');
const https = require('https');

class HttpsProvider extends Provider {
    constructor(providerId, {endpoint, port, headers, method, path, keyFilePath, certFilePath}, authHandler) {
        super();

        this.id = providerId;
        this.setAuthHandler(authHandler);
        this.httpsOptions = {
            hostname: endpoint,
            port: port,
            path: path,
            method: method,
            key: keyFilePath,
            cert: certFilePath,
            headers: headers
        };
    }

    // Set auth handler that will handle auth flow for this provider
    setAuthHandler(authHandler) {
        if (authHandler.isAuthHandler) throw Error('Auth handler must be instance of AuthHandler class.');
        this.authHandler = authHandler;
    }

    initQueryRespond(responseParser, filters, from) {
        let httpsHandler = async (incomingEvent) => {
            try {
                if (!this.authHandler.isLoggedIn) {
                    this.httpsOptions = await this.authHandler.login(this.httpsOptions);
                }
                const response = await https.request(options);
                return responseParser(response);
            } catch (e) {
                if (e.status === 401) {
                    this.httpsOptions = await this.authHandler.onAuthError(this.httpsOptions);
                }
            }
        };

        return super.listenQueries(filters, httpsHandler, from);
    }
}