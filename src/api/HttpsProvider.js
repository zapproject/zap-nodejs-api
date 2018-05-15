const Provider = require('./components/Provider');
const axios = require('axios');

const AUTH_ERROR_CODE = 401;


class HttpsProvider extends Provider {
    constructor(dispatch, arbiter, providerId, {scheme, hostname, port, headers, method, path, key, cert}, authHandler) {
        super(dispatch, arbiter);

        this.id = providerId;
        this.authHandler = authHandler;
        this.httpOptions = {
            scheme: scheme,
            hostname: hostname,
            port: port,
            path: path,
            method: method,
            key: key,
            cert: cert,
            headers: headers
        };
        this.httpClient = axios.create({
            baseURL: hostname ? scheme + '://' + hostname : '',
            timeout: 10000,
            headers: headers
        });
    }

    get authHandler() {
        return this._authHandler;
    }

    // Set auth handler that will handle auth flow for this provider
    set authHandler(authHandler) {
        if (!authHandler.isAuthHandler) throw Error('Auth handler must be instance of AuthHandler class.');
        this._authHandler = authHandler;
    }

    initQueryRespond(responseParser, filters, from) {
        let httpsHandler = async (incomingEvent) => {
            try {
                if (!this.authHandler.isLoggedIn) {
                    this.httpOptions = await this.authHandler.login(this.httpOptions);
                }
                let response = await this.httpClient({
                    method: this.httpOptions.method,
                    url: this.httpOptions.path,
                    headers: this.httpOptions.headers
                });
                return responseParser(response);
            } catch (e) {
                console.log(e);
                if (e.status === AUTH_ERROR_CODE) {
                    this.httpOptions = await this.authHandler.onAuthError(this.httpOptions);
                }
            }
        };

        return super.listenQueries(filters, httpsHandler, from);
    }
}

module.exports = HttpsProvider;