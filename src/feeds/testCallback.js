module.exports = (liveProvider) => {
    setInterval(() => {
        liveProvider.publish('testing ZAPCLI');
    }, 5000);
}
