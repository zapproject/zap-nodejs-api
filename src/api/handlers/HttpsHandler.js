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
            url: url,
            headers: this.httpOptions.headers
        });

        return this.responseParser.parseIncomingResponse(response);
    }

    async notarize(url) {
        await this.auth.updateNotarizeCredentials();

        try {
            // run notarize
            let fileUrl = await lambda.invoke('notarize', {
                url: url,
                headers: this.httpOptions.headers
            });

            return await lambda.invoke('auditor', {
                audit_file_url: fileUrl
            });
        } catch (e) {
            console.log(e);
            this.auth.setAwsCredentialsOutdated();
        }
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


module.exports.HttpsHandler = HttpsHandler;
module.exports.Parser = ResponseParser;