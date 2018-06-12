// TODO: Add CLI to project
const StorageNotary = require('StorageNotary');


class Auth {
    constructor() {
        this.isLoggedIn = false;
        this.isAwsCredentialsUpdated = false;
    }

    setAwsCredentialsOutdated() {
        this.isAwsCredentialsUpdated = false;
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

    // should be implemented to update aws credentials for notarize
    async updateNotarizeCredentials() {
        this.isAwsCredentialsUpdated = true;
    }
}

class AuthDb extends Auth {
    constructor(dbPath, region, providerId) {
        super();

        this.dbPath = dbPath;
        this.providerId = providerId;
        this.region = region;
        this.db = new StorageNotary(dbPath);
    }

    // should be implemented to update aws credentials for notarize
    async updateNotarizeCredentials() {
        if (this.isAwsCredentialsUpdated) return;

        const res = await this.db.read('null', this.providerId, 'null', 'null');

        process.env.AWS_ACCESS_KEY_ID = res.accesskey;
        process.env.AWS_SECRET_ACCESS_KEY = res.secretkey;
        process.env.AWS_REGION = this.region;

        super.updateNotarizeCredentials();
    }
}

class AuthRuntime extends Auth {
    constructor(awsCredentials) {
        super();

        this.awsSecretAccessKey = awsCredentials.secretAccessKey;
        this.awsAccessKeyId = awsCredentials.accessKeyId;
        this.awsRegion = awsCredentials.region;
        this.isAwsCredentialsUpdated = false;
    }

    get awsRegion() {
        return this.awsCredentials._region;
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

    setAwsCredentialsOutdated() {
        this.isAwsCredentialsUpdated = false;
    }

    // should be implemented to update aws credentials for notarize
    async updateNotarizeCredentials() {
        if (this.isAwsCredentialsUpdated) return;

        process.env.AWS_ACCESS_KEY_ID = this.awsAccessKeyId;
        process.env.AWS_SECRET_ACCESS_KEY = this.awsSecretAccessKey;
        process.env.AWS_REGION = this.awsRegion;

        super.updateNotarizeCredentials();
    }

}

module.exports.Auth = Auth;
module.exports.AuthRuntime = AuthRuntime;
module.exports.AuthDb = AuthDb;