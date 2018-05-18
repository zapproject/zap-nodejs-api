const axios = require('axios');
const lambda = require('aws-lambda-invoke');
const Handler = require('../components/Handler');

const AUTH_ERROR_CODE = 401;

class HttpsHandler extends Handler {
    constructor(providerId, {baseUrl, port, headers, method, path, agent}, parser, auth) {
        super();

        this.id = providerId;
        this.parser = parser;
        this.auth = auth;

        this.httpOptions = {
            baseUrl: baseUrl,
            port: port,
            path: path,
            method: method,
            httpClient: axios.create({
                baseURL: baseUrl,
                timeout: 10000,
                headers: headers,
                httpsAgent: agent
            })
        };

        process.env.AWS_ACCESS_KEY_ID = 'AKIAI73YIGOIBAHBMCWA';
        process.env.AWS_SECRET_ACCESS_KEY = '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';
        process.env.AWS_REGION = 'eu-west-1';
    }

    async handleSubscription(event) {
        return new Error("Not implemented yet");
    }

    async handleUnsubscription(event) {
        return new Error("Not implemented yet");
    }

    async handleIncoming(event) {
        const incomingEvent = Handler.parseIncomingEvent(event);
        try {
            if (!this.auth.isLoggedIn) {
                this.httpOptions = await this.auth.login(this.httpOptions);
            }

            console.log('Incoming event: ' + JSON.stringify(incomingEvent));

            const url = this.httpOptions.path + '?' + incomingEvent.query;

            this.notarize(url);

            return await this.doRequest(url)
        } catch (e) {
            console.log(e);
            if (e.status === AUTH_ERROR_CODE) {
                this.httpOptions = await this.auth.onAuthError(this.httpOptions);

                this.handleIncoming(event);
            }
        }
    }

    async doRequest(urlWithQuery) {
        let response = await this.httpOptions.httpClient({
            method: this.httpOptions.method,
            url: url,
            headers: this.httpOptions.headers
        });

        return this.parser.parseIncomingResponse(response);
    }

    async notarize(url) {
        // run notarize
        let fileUrl = await lambda.invoke('notarize', {
            url: url,
            headers: this.httpOptions.headers
        });

        return await lambda.invoke('auditor', {
            audit_file_url: fileUrl
        });
    }

    async insertSubscription() { return new Error("Not implemented yet"); }

    async deleteSubscription() { return new Error("Not implemented yet"); }

    async updateSubscription() { return new Error("Not implemented yet"); }

    async getSubscriptionsList() { return new Error("Not implemented yet"); }

    get parser() {
        return this._parser;
    }

    set parser(parser) {
        this._parser = parser;
    }

    get auth() {
       return this._auth;
    }

    set auth(auth) {
        this._auth = auth;
    }
}

class Parser {
    constructor() {

    }

    // should return array of params for smart contract callback function
    // params.length > 0 && params.length < 5
    parseIncomingResponse(response) {
        return response;
    }
}

class Auth {
    constructor() {
        this.isLoggedIn = false;
    }

    // should be implemented to handle authentication inside https handler
    async login(httpOptions) {
        this.isLoggedIn = true;
        return httpOptions;
    }

    // should be implemented to handle authentication errors inside https handler
    async onAuthError(httpOptions) {
        this.isLoggedIn = false;
        return httpOptions;
    }
}

module.exports.HttpsHandler = HttpsHandler;
module.exports.Parser = Parser;
module.exports.Auth = Auth;