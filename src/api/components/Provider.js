const Arbiter = require("./../contracts/Arbiter");
const Dispatch = require("./../contracts/Dispatch");
const Registry = require("./../contracts/Registry");

class Provider {
    constructor({owner, handler}) {
        assert(owner, "owner address is required");
        assert(handler, "handler needs to be specified")
        this.owner = owner
        this.handler = handler;
    }

    /**
     *
     * @param pubkey
     * @param title
     * @param endpoint
     * @param params
     * @returns {Promise<any>}
     */
    async create({public_key, title, endpoint, endpoint_params}) {
        try {
            assert(Array.isArray(params), "params need to be an array");
            // if (params.length > 0) {
            //     for (let i in params) {
            //         params[i] = web3.utils.utf8ToHex(params[i])
            //     }
            // }
            let provider = await Registry.initiateProvider(
                {public_key, title, endpoint, endpoint_params, from:this.owner})
            return provider
        } catch (err) {
            console.error(err)
        }
    }

    /**
     *
     * @param endpoint
     * @param constants
     * @param parts
     * @param dividers
     * @returns {Promise<*>}
     */
    async initCurve({endpoint, constants, parts, dividers}) {
        try {
            assert((constants instanceof Array
                && parts instanceof Array
                && dividers instanceof Array),
                "curve's arguments need to be array");
            assert(endpoint && constants.length > 0
                && parts.length > 0
                && dividers.length > 0,
                "cant init empty curve args");
            let convertedConstants = constants.map(item => {
                return web3.utils.toHex(item)
            });
            let convertedParts = parts.map(item => {
                return web3.utils.toHex(item)
            });
            let convertedDividers = dividers.map(item => {
                return web3.utils.toHex(item)
            });
            let curve ={constants,parts,dividers}
            //console.log("converted : ", convertedConstants);
            let success = await Registry.initiateProviderCurve({endpoint, curve, from:this.owner})

            assert(success, "fail to init curve ");
            return success
        } catch (err) {
            console.error(err)
            return null
        }
    }


    /**
     *
     * @returns {Promise<string>}
     */
    async getProviderTitle() {
        let title = await Registry.getProviderTitle(this.owner).call()
        return web3.utils.hexToUtf8(title)
    }

    /**
     *
     * @returns {Promise<string>}
     */
    async getProviderPubkey() {
        let title = await Registry.getProviderPubkey(this.owner).call()
        return web3.utils.hexToUtf8(title)
    }

    /**
     *
     * @param endpoint
     * @returns {Promise<*>}
     */
    async getProviderCurve({endpoint}) {
        try {
            let curve = await Registry.getProviderCurve(
                this.owner, web3.utils.utf8ToHex(endpoint)).call();
            return curve
        } catch (err) {
            console.error(err)
            return null
        }
    }

    /**
     *
     * @param endpoint
     * @returns {Promise<any>}
     */
    async getZapBound({endpoint}) {
        assert(endpoint, "endpoint required");
        let zapBound = await Bondage.methods.getZapBound(this.owner, web3.utils.utf8ToHex(endpoint)).call();
        return zapBound;
    }

    /**
     *
     * @param endpoint
     * @param dots
     * @returns {Promise<number>}
     */
    async getZapRequired({endpoint, dots}) {
        let zapRequired = await Bondage.methods.calcZapForDots(this.owner, web3.utils.utf8ToHex(endpoint), web3.utils.toBN(dots)).call();
        return parseInt(zapRequired);
    }

    /**
     *
     * @param endpoint
     * @param zapNum
     * @returns {Promise<any>}
     */
    async calcDotsForZap({endpoint, zapNum}) {
        let res = await Bondage.calcBondRate(
            this.owner,
            web3.utils.utf8ToHex(endpoint),
            web3.utils.toBN(zapNum)).call();
        console.log("dot for zap : ", zapNum, res);
        return res
    }


    /**
     *
     * @param subscriber
     * @param fromBlock
     * @returns {Promise<*>}
     */
    async listenSubscribes({subscriber, fromBlock}) {
        let callback = (error, result) => {
            if (error) {
                console.log(error);
            } else {
                try {
                    this.handler.handleSubscription(result);
                } catch (e) {
                    console.log(e);
                }
            }
        };

        let event = Arbiter.events.DataPurchaseEvent(
            {provider: this.owner, subscriber},
            {fromBlock: fromBlock, toBlock: 'latest'});
        event.watch(callback);
        return event;
    }

    /**
     *
     * @param subscriber
     * @param terminator
     * @param fromBlock
     * @returns {Promise<void>}
     */
    async listenUnsubscribes({subscriber, terminator, fromBlock}) {
        if (!this.arbiter) throw new Error('ZapArbiter class must be specified!');

        const contract = await this.arbiter.contractInstance();

        let callback = (error, result) => {
            if (error) {
                console.log(error);
            } else {
                try {
                    this.handler.handleUnsubscription(result);
                } catch (e) {
                    console.log(e);
                }
            }
        };

        let event = Arbiter.listenSubscriptionEnd(
            {provider: this.owner, subscriber, terminator},
            {fromBlock: fromBlock, toBlock: 'latest'});
        event.watch(callback);
        return event;
    }

    /**
     *
     * @param id
     * @param subscriber
     * @param fromBlock
     * @param from
     * @returns {Promise<void>}
     */
    async listenQueries({id, subscriber, fromBlock}, from) {
        if (!this.dispatch) throw new Error('ZapDispatch class must be specified!');

        let callback = (error, result) => {
            if (error) {
                console.error(error);
            } else {
                try {
                    let respondParams = this.handler.handleIncoming(result);
                    this.dispatch.respond(result.args.id.valueOf(), respondParams, from);
                } catch (e) {
                    console.error(e);
                }
            }
        };

        Dispatch.listen("Incoming",
            {id, provider: this.owner, subscriber, fromBlock},
            callback);
    }

    get handler() {
        return this._handler;
    }

    set handler(handler) {
        this._handler = handler;
    }
}

module.exports = Provider;