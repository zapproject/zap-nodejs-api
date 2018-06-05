const axios = require('axios');
const lambda = require('aws-lambda-invoke');
const Handler = require('../components/Handler');

const AUTH_ERROR_CODE = 401;

class HttpsHandler extends Handler {
    constructor(providerId, {baseUrl, port, headers, method, path, agent}, parser, auth) {
        super();

        this.id = providerId;
        this.responseParser = parser;
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

        process.env.AWS_ACCESS_KEY_ID = this.auth.awsAccessKeyId;
        process.env.AWS_SECRET_ACCESS_KEY = this.auth.awsSecretAccessKey;
        process.env.AWS_REGION = this.auth.awsRegion;
    }

    async handleSubscription(event) {
        return new Error("Not implemented yet");
    }

    async handleUnsubscription(event) {
        return new Error("Not implemented yet");
    }

    async handleIncoming(event) {
        const incomingEvent = this.eventParser.parseIncomingEvent(event);
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
            url: urlWithQuery,
            headers: this.httpOptions.headers
        });

        return this.responseParser.parseIncomingResponse(response);
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

    get responseParser() {
        return this._responseParser;
    }

    set responseParser(parser) {
        this._responseParser = parser;
    }

    get auth() {
       return this._auth;
    }

    set auth(auth) {
        this._auth = auth;
    }
}

class ResponseParser {
    constructor() {

    }

    // should return array of params for smart contract callback function
    // params.length > 0 && params.length < 5
    parseIncomingResponse(response) {
        return response;
    }
}

class Auth {
    constructor(awsCredentials) {
        this.isLoggedIn = false;

        this.awsSecretAccessKey = awsCredentials.secretAccessKey;
        this.awsAccessKeyId = awsCredentials.accessKeyId;
        this.awsRegion = awsCredentials.region;
    }

    get awsRegion() {
        return this._region;
    }

    set awsRegion(region) {
        return this._region = region;
    }

    get awsAccessKeyId() {
        return this._access_key_id;
    }

    set awsAccessKeyId(accessKeyId) {
        return this._access_key_id = accessKeyId;
    }

    get awsSecretAccessKey() {
        return this._secret_access_key;
    }

    set awsSecretAccessKey(secretAccessKeyId) {
        return this._secret_access_key = secretAccessKeyId;
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
module.exports.Parser = ResponseParser;
module.exports.Auth = Auth;