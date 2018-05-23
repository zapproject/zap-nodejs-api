class Provider {
    constructor(dispatch, arbiter, handler) {
        this.dispatch = dispatch;
        this.arbiter = arbiter;
        this.handler = handler;
    }

    async listenSubscribes({provider, subscriber, fromBlock}) {
        if (!this.arbiter) throw new Error('ZapArbiter class must be specified!');

        const contract = await this.arbiter.contractInstance();
        return contract.events.DataPurchaseEvent({ provider, subscriber }, { fromBlock: 0, toBlock: 'latest' },
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

    async listenUnsubscribes({provider, subscriber, terminator, fromBlock}) {
        if (!this.arbiter) throw new Error('ZapArbiter class must be specified!');

        const contract = await this.arbiter.contractInstance();
        return contract.events.DataSubscriptionEnd({ provider, subscriber, terminator }, { fromBlock: fromBlock, toBlock: 'latest' },
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

    async listenQueries({id, provider, subscriber, fromBlock}, from) {
        if (!this.dispatch) throw new Error('ZapDispatch class must be specified!');

        const contract = await this.dispatch.contractInstance();
        return contract.events.Incoming({id, provider, subscriber}, { fromBlock: fromBlock, toBlock: 'latest' },
            (error, result) => {
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