// stop jshint from complaing about __proto__
/*jshint -W103 */

var util = require('util');
var sup  = require('../');
var Expression  = require('../');
var Global = require('../../global');

module.exports = Vector;

function Vector(e) {
    e.__proto__ = Vector.prototype;
    return e;
}

util.inherits(Vector, sup);

var _ = Vector.prototype;

_[',.'] = function (x) {
    return Vector(Array.prototype.concat.call(this, [x]));
};

_.differentiate = function (x) {
    return Vector(Array.prototype.map.call(this, function (c) {
        return c.differentiate(x);
    }));
};
_.cross = function (x) {
    if (this.length !== 3 || x.length !== 3) {
        throw('Cross product only defined for 3D vectors.');
    }
    /*
    i   j    k
    x   y    z
    a   b    c
    
    = (yc - zb, za - xc, xb - ya)
    */
    
    return new Vector([
        this[1].default(x[2])['-'](this[2].default(x[1])),
        this[2].default(x[0])['-'](this[0].default(x[2])),
        this[0].default(x[1])['-'](this[1].default(x[0]))
    ]);
};

// crossProduct is the '&times;' character
var crossProduct = String.fromCharCode(215);

_[crossProduct] = _.cross;
_.default = function (x) {
    var l = this.length;
    if (x instanceof Vector) {
        // Dot product
        if(l !== x.length) {
            throw('Vector Dimension mismatch.');
        }
        var i;
        var sum = Global.Zero;
        for (i = 0; i < l; i++) {
            sum = sum['+'](
                (this[i]).default(x[i])
            );
        }
        return sum;
    } else {
        // Scalar multiplication:
        return Vector(Array.prototype.map.call(this, function (c) {
            return c.default(x);
        }));
    }
};
_['*'] = _.default;
_['+'] = function (x, op) {
    var l = this.length;
    if(l !== x.length) {
        throw(new MathError('Vector Dimension mismatch.'));
    }
    var i;
    var n = new Array(l);
    for (i = 0; i < l; i++) {
        n[i] = this[i][op || '+'](x[i]);
    }
    return Vector(n);
};
_['-'] = function (x) {
    return this['+'](x, '-');
};
_['/'] = function (x) {
    if (x instanceof Vector) {
        throw('Vector division not defined');
    }
    return Vector(Array.prototype.map.call(this, function (c) {
        return c['/'](x);
    }));
    
};
_['^'] = function (x) {
    if(x instanceof Expression.Integer) {
        if(x.a === 0) {
            throw('Raised to zero power');
        }
        if(x.a === 1) {
            return this;
        }
        if (x.a === 2) {
            var S = Global.Zero;
            var i, l = this.length;
            for (i = 0; i < l; i++) {
                S = S['+'](this[i]['^'](x));
            }
            return S;
        } else {
            return this['^'](new Expression.Integer(x.a - 1))['*'](this);
        }
    } else if(x instanceof Expression.Rational){
        return this['^'](x.a)['^'](Global.One['/'](x.b));
    } else if (x.constructor === Expression.NumericalComplex) {
        return new Expression.Complex(this.value + x._real, x._imag);
    } else if(x.constructor === Expression.List.ComplexCartesian) {
        // commute
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.ComplexPolar) { 
        return (x)['+'](this);
    } else if(x.constructor === Expression.List.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.Symbol.Real) {
        return (x)['+'](this);
    } else if(x.constructor === Expression.List) {
        return (x)['+'](this);
    } else {
        throw ('Unknown Type for Vector ^');
    }
    return this.default(this['^'](x['-'](Global.One)));
};

_.old_apply_operator = function(operator, e) {
    var l = this.length;
    var i;
    switch (operator) {
        case ',':
            //Array.prototype.push.apply(this, [e]);
            //Faster:
            //MODIFIES!!!!!!!!!
            this[l] = e;
            return this;
        case undefined:
        case '*':
            if(l !== e.length) {
                throw('Vector Dimension mismatch.');
            }
            var sum = M.Global.Zero;
            for (i = 0; i < l; i++) {
                sum = sum.apply('+', this[i].apply('*', e[i]));
            }
            return sum;
        case '+':
        case '-':
            if(l !== e.length) {
                throw('Vector Dimension mismatch.');
            }
            var n = new Array(l);
            for (i = 0; i < l; i++) {
                n[i] = this[i].apply(operator, e[i]);
            }
            return Vector(n);
        case '/':
        case '^':
            break;
        default:
            throw('Vector operation not allowed.');
    }
};

_.realimag = function(){
    var l = this.length;
    var _x = new Array(l);
    var _y = new Array(l);
    var i;
    for(i = 0; i < l; i++) {
        var ri = this[i].realimag();
        _x[i] = ri[0];
        _y[i] = ri[1];
    }
    return Expression.List.ComplexCartesian([
        Vector(_x),
        Vector(_y)
    ]);
};

_._s = function(Code, lang) {
    var l = this.length;
    var open = '[';
    var close = ']';
    if(lang === 'x-shader/x-fragment') {
        open = 'vec' + this.length + '(';
        close = ')';
    }
    var c = this[0]._s(Code, lang);
    var i;
    var t_s = [];
    for (i = 0; i < l; i++) {
        var c_i = this[i]._s(Code, lang);
        t_s.push(c_i.s);
        c = c.merge(c_i);
    }
    return c.update(open + t_s.join(',') + close, Infinity);
};