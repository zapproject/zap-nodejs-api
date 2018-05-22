class Provider {
    constructor(dispatch, arbiter, handler) {
        this.dispatch = dispatch;
        this.arbiter = arbiter;
        this.handler = handler;
    }

    listenSubscribes({provider, subscriber, fromBlock}) {
        if (!this.arbiter || !this.arbiter.isZapArbiter) throw new Error('ZapArbiter class must be specified!');

        return this.arbiter.contract.events.DataPurchaseEvent({filter: {provider, subscriber}, fromBlock: fromBlock},
            (error, result) => {
                if (error) {
                    console.log(error);
                } else {
                    try {
                        this.handler.handleSubscription(result);
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
    }

    listenUnsubscribes({provider, subscriber, terminator, fromBlock}) {
        if (!this.arbiter || !this.arbiter.isZapArbiter) throw new Error('ZapArbiter class must be specified!');

        return this.arbiter.contract.events.DataSubscriptionEnd({filter: {provider, subscriber, terminator}, fromBlock: fromBlock},
            (error, result) => {
                if (error) {
                    console.log(error);
                } else {
                    try {
                        this.handler.handleUnsubscription(result);
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
    }

    listenQueries({id, provider, subscriber, fromBlock}, from) {
        if (!this.dispatch || !this.dispatch.isZapDispatch) throw new Error('ZapDispatch class must be specified!');

        return this.dispatch.contract.events.Incoming({filter: {id, provider, subscriber}, fromBlock: fromBlock}, (error, result) => {
            if (error) {
                console.log(error);
            } else {
                try {
                    let respondParams = this.handler.handleIncoming(result);
                    this.dispatch.respond(result.returnValues.id, respondParams, from);
                } catch (e) {
                    console.log(e);
                }
            }
        });
    }

    get handler() {
        return this._handler;
    }

    set handler(handler) {
        this._handler = handler;
    }

    get dispatch() {
        return this._dispatch;
    }

    set dispatch(dispatch) {
        this._dispatch = dispatch;
    }

    get arbiter() {
        return this._arbiter;
    }

    set arbiter(arbiter) {
        this._arbiter = arbiter;
    }
}

module.exports = Provider;