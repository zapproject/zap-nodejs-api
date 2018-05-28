class Curve {
    constructor(curveType, curveStart, curveMultiplier) {
        this.type = curveType;
        this.start = curveStart;
        this.multiplier = curveMultiplier;
    }

    // Get the price of a dot at a given totalBound
    getPrice(total) {
        let x = 0;

        switch ( this.type ) {
        case 1: // Linear curve
            x = (total * this.multiplier);
            break;

        case 2: // Exponential curve
            x = Math.pow(total, 2);
            break;

        case 3:
            x = Math.log(x, 2);
            break;
        }

        return this.start + (this.multiplier * x);
    }
}

module.exports = Curve;
