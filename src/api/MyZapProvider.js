
class MyZapProvider {

    constructor(dispatch, arbiter) {
        this.dispatch = dispatch;
        this.arbiter = arbiter;
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

    listenSubscribes({provider, subscriber}, callback) {
        if (!this.arbiter || !this.arbiter.isZapArbiter) throw new Error('ZapArbiter class must be specified!');

        return this.arbiter.contract.events.DataPurchaseEvent({filter: {provider, subscriber}, fromBlock: 0},
            (error, result) => {
                if (error) {
                    console.log(error);
                } else {
                    try {
                        callback(MyZapProvider.parseDataPurchaseEvent(result));
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
    }

    listenUnsubscribes({provider, subscriber, terminator}, callback) {
        if (!this.arbiter || !this.arbiter.isZapArbiter) throw new Error('ZapArbiter class must be specified!');

        return this.arbiter.contract.events.DataSubscriptionEnd({filter: {provider, subscriber, terminator}, fromBlock: 0},
            (error, result) => {
                if (error) {
                    console.log(error);
                } else {
                    try {
                        callback(MyZapProvider.parseDataSubscriptionEnd(result));
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
    }

    initQueryRespond({id, provider, subscriber}, handler, from) {
        if (!this.dispatch || !this.dispatch.isZapDispatch) throw new Error('ZapDispatch class must be specified!');

        return this.dispatch.contract.events.Incoming({filter: {id, provider, subscriber}, fromBlock: 0}, (error, result) => {
            if (error) {
                console.log(error);
            } else {
                try {
                    const respondParams = handler(MyZapProvider.parseIncomingEvent(result));
                    this.dispatch.respond(result.returnValues.id, respondParams, from);
                } catch (e) {
                   console.log(e);
                }
            }
        });
    }
}

module.exports = MyZapProvider;