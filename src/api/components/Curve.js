class Curve {
    constructor(constants, parts, dividers) {
        this.constants = constants;
        this.parts = parts;
        this.dividers = dividers;

        this.structurize();
    }

    // should be called if fields were updated
    structurize() {
        this.pieces = Array();
        let pStart = 0;

        for (let i = 0; i < this.dividers.length; i++) {
            let piece = Object();
            piece.start = this.parts[2 * i];
            piece.end =  this.parts[(2 * i) + 1];
            piece.terms = Array();
            this.pieces.push(piece);

            for (let j = pStart; j < this.dividers[i]; j++) {
                let term = Object();
                term.coef = this.constants[(3 * j)];
                term.power = this.constants[(3 * j) + 1];
                term.fn = this.constants[(3 * j) + 2];

                this.pieces[i].terms.push(term);
            }

            pStart = this.dividers[i];
        }
    }

    // Get the price of a dot at a given totalBound
    getPrice(total) {
        if (total < 0) {
            return 0;
        }

        if (!this.pieces) {
            return 0;
        }

        for (let i = 0; i < this.pieces.length; i++) {
            if (this.pieces[i].start <= total && total <= this.pieces[i].end) {
                return this._calculatePolynomial(this.pieces[i].terms, total);
            }
        }

        return 0;
    }

    _calculateTerm(term, x) {
        let val = 1;

        if (term.fn === 0) {
            if (x < 0) x = -x;
        }  else if (term.fn === 1) {
            if (x < 0) {
                x = 0;
            } else  {
                x = Math.log2(x);
            }
        }

        if (term.power > 0) {
            val = Math.pow(x, term.power);
        }

        return val * term.coef;
    }

    _calculatePolynomial(terms, x) {
        let sum = 0;

        for (let i = 0; i < terms.length; i++ ) {
            sum += this._calculateTerm(terms[i], x);
        }

        return sum;
    }
}

module.exports = Curve;
