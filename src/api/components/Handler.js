class Handler {
    constructor() {

    }

    static parseIncomingEvent(event) {
        if (!event.returnValues) throw new Error('Must be event object!');
        if (event.event !== 'Incoming') throw new Error('Wrong event for parsing. Event name = ' + event.event + ', must be Incoming');

        let incomingEvent = Object();
        incomingEvent.id = event.returnValues.id;
        incomingEvent.provider = event.returnValues.provider;
        incomingEvent.subscriber = event.returnValues.subscriber;
        incomingEvent.query = event.returnValues.query;
        incomingEvent.endpoint = event.returnValues.endpoint;
        incomingEvent.endpointParams = event.returnValues.endpointParams;
        return incomingEvent;
    }

    static parseDataPurchaseEvent(event) {
        if (!event.returnValues) throw new Error('Must be event object!');
        if (event.event !== 'Incoming') throw new Error('Wrong event for parsing. Event name = ' + event.event + ', must be Incoming');

        let dataPurchaseEvent;
        dataPurchaseEvent.provider = event.returnValues.provider;
        dataPurchaseEvent.subscriber = event.returnValues.subscriber;
        dataPurchaseEvent.publicKey = event.returnValues.publicKey;
        dataPurchaseEvent.amount = event.returnValues.amount;
        dataPurchaseEvent.endpointParams = event.returnValues.endpointParams;
        dataPurchaseEvent.endpoint = event.returnValues.endpoint;

        return dataPurchaseEvent;
    }

    static parseDataSubscriptionEnd(event) {
        if (!event.returnValues) throw new Error('Must be event object!');
        if (event.event !== 'Incoming') throw new Error('Wrong event for parsing. Event name = ' + event.event + ', must be Incoming');

        let dataSubscriptionEnd;
        dataSubscriptionEnd.provider = event.returnValues.provider;
        dataSubscriptionEnd.subscriber = event.returnValues.subscriber;
        dataSubscriptionEnd.terminator = event.returnValues.terminator;

        return dataSubscriptionEnd;
    }


    // Parse a subscription event
    async handleSubscription(event) {
        return new Error("Attempted to use a generic Handler");
    }

    async handleUnsubscription(event) {
        return new Error("Attempted to use a generic Handler");
    }

    async handleIncoming(event) {
        return new Error("Attempted to use a generic Handler");
    }
}

module.exports = Handler;
