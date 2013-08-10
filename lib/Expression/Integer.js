var util = require('util');
var sup = require('./Rational');
var Global = require('../global');

module.exports = Integer;

util.inherits(Integer, sup);

function Integer(x) {
    this.a = x;
}

var _ = Integer.prototype;

_.b = 1;

_['+'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(this.a + x.a);
    }
    return x['+'](this);
};

_['-'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(this.a - x.a);
    }
    return sup.prototype['-'].call(this, x);
};

_['/'] = function (x) {
    if(x instanceof Integer) {
        if(this.a % x.a === 0) {
            return new Integer(this.a / x.a);
        }
        return new sup(this.a, x.a);
    }
    return sup.prototype['/'].call(this, x);
};

_['@-'] = function () {
    return new Integer(-this.a);
};

_['*'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(this.a * x.a);
    }
    return x['*'](this);
};

_['^'] = function (x) {
    if (x instanceof Integer) {
        return new Integer(Math.pow(this.a, x.a));
    } else if (x.constructor === sup) {
        var f = x.reduce();
        if(f.a % 2 === 0) {
            return new Expression.NumericalReal(Math.pow(Math.pow(this.a, f.a), 1 / f.b));
        } else {
            return Expression.NumericalReal.prototype['^'].call(
                this,
                x
            );
        }
    } else if (x.constructor === Expression.List.Real || x.constructor === Expression.Symbol.Real) {
        if(this.a > 0) {
            return Expression.List.Real([
                this,
                x
            ], '^');
        }
    }
    return Expression.NumericalReal.prototype['^'].call(
        this,
        x
    );
    
};

_['%'] = function (x) {
    if(x instanceof Integer) {
        return new Integer(this.a % x.a);
    } else if (x.constructor === sup) {
        return new sup();// @todo: !
    } else if (x.constructor === Expression.NumericalReal) {
        return new Expression.NumericalReal(this % x.value);
    } else {
        return Expression.List.Real([this, x], '%');
    }
};

_._s = function (Code, lang) {
    if(lang === 'x-shader/x-fragment') {
        return new Code(this.a.toString() + '.0');
    }
    return new Code(this.a.toString());
};