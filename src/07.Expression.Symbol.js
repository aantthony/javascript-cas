Expression.Symbol = function (str) {
    //Req: str is a String
	this.symbol = str;
};

Expression.Symbol.prototype = Object.create(Expression.prototype);

Expression.Symbol.prototype.differentiate = function(x) {
    if (this.symbol === x.symbol) {
        return M.Global.One;
    } else {
        return M.Global.Zero;
    }
};
Expression.Symbol.prototype.integrate = function(x) {
    if (this.symbol === x) {
        return new Expression.NumericalReal(0.5, 0).apply('*', x.apply('^', new Expression.NumericalReal(2,0)));
    } else {
        return this.apply('*', x);
    }
};

Expression.Symbol.prototype.toString = function() {
	return this.symbol;
};

Expression.Symbol.prototype.constructor = Expression.Symbol;

// ============= Real Number ================ //
Expression.Symbol.Real = function(str) {
    this.symbol = str;
};
Expression.Symbol.Real.prototype = Object.create(Expression.Symbol.prototype);
Expression.Symbol.Real.prototype.realimag = function() {
    return [this, M.Global.Zero];
};
Expression.Symbol.Real.prototype.real = function() {
    return this;
};
Expression.Symbol.Real.prototype.imag = function() {
    return M.Global.Zero;
};