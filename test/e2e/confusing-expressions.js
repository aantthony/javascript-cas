var should = require('should'),
    $ = require('../$'),
    M = require('../../'),
    Integer = M.Expression.Integer,
    Symbol  = M.Expression.Symbol,
    Real    = Symbol.Real,
    List    = M.Expression.List;

describe('Confusing expression', function () {
    
    describe($('d/dx (x - (1 + 8x))'), function () {
        it($('= -7'), function () {
            var d = M('\\frac{d}{dx} \\left(x - (1 + 8x)\\right)');
            d.should.not.be.an.instanceof(List.Real);
            d.compile()().should.equal(-7);
        })
    });
    describe($('1 - 1 - 1'), function () {
        it($('= -1'), function () {
            var d = M('1 - 1 - 1');
            d.compile()().should.equal(-1);
        })
    });
    describe($('d/dw (1)'), function () {
        it($('= 0'), function () {
            var expr = M('\\frac{d}{dx} (1)');
            var d = expr.differentiate(new Symbol.Real());
            d.should.be.an.instanceof(Integer);
            d.a.should.equal(0);
        })
    });
});
