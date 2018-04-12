class Handler {
    constructor() {

    }

    // Parse a subscription event
    parseSubscription(events) {
        return new Error("Attempted to use a generic Handler");
    }
}

module.exports = Handler;
