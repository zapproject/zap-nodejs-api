class Handler {
    constructor() {
        this.eventParser = new TruffleEventsParser();
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

    get eventParser() {
        return this._eventParser;
    }

    set eventParser(eventParser) {
        this._eventParser = eventParser;
    }
}

class EventParser {
    parseIncomingEvent(event) { }

    parseDataPurchaseEvent(event) { }

    parseDataSubscriptionEnd(event) { }
}

class TruffleEventsParser extends EventParser{
    parseIncomingEvent(event) {
        if (!event.args) throw new Error('Must be event object!');
        if (event.event !== 'Incoming') throw new Error('Wrong event for parsing. Event name = ' + event.event + ', must be Incoming');

        let incomingEvent = Object();
        incomingEvent.id = event.args.id;
        incomingEvent.provider = event.args.provider;
        incomingEvent.subscriber = event.args.subscriber;
        incomingEvent.query = event.args.query;
        incomingEvent.endpoint = event.args.endpoint;
        incomingEvent.endpointParams = event.args.endpointParams;
        return incomingEvent;
    }

    parseDataPurchaseEvent(event) {
        if (!event.args) throw new Error('Must be event object!');
        if (event.event !== 'Incoming') throw new Error('Wrong event for parsing. Event name = ' + event.event + ', must be Incoming');

        let dataPurchaseEvent;
        dataPurchaseEvent.provider = event.args.provider;
        dataPurchaseEvent.subscriber = event.args.subscriber;
        dataPurchaseEvent.publicKey = event.args.publicKey;
        dataPurchaseEvent.amount = event.args.amount;
        dataPurchaseEvent.endpointParams = event.args.endpointParams;
        dataPurchaseEvent.endpoint = event.args.endpoint;

        return dataPurchaseEvent;
    }

    parseDataSubscriptionEnd(event) {
        if (!event.args) throw new Error('Must be event object!');
        if (event.event !== 'Incoming') throw new Error('Wrong event for parsing. Event name = ' + event.event + ', must be Incoming');

        let dataSubscriptionEnd;
        dataSubscriptionEnd.provider = event.args.provider;
        dataSubscriptionEnd.subscriber = event.args.subscriber;
        dataSubscriptionEnd.terminator = event.args.terminator;

        return dataSubscriptionEnd;
    }
}

class Web3EventsParser extends EventParser{
    parseIncomingEvent(event) {
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

    parseDataPurchaseEvent(event) {
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

    parseDataSubscriptionEnd(event) {
        if (!event.returnValues) throw new Error('Must be event object!');
        if (event.event !== 'Incoming') throw new Error('Wrong event for parsing. Event name = ' + event.event + ', must be Incoming');

        let dataSubscriptionEnd;
        dataSubscriptionEnd.provider = event.returnValues.provider;
        dataSubscriptionEnd.subscriber = event.returnValues.subscriber;
        dataSubscriptionEnd.terminator = event.returnValues.terminator;

        return dataSubscriptionEnd;
    }
}

module.exports = Handler;
