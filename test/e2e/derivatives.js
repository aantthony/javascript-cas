var should = require('should'),
    $ = require('../$'),
    M = require('../../'),
    Integer = M.Expression.Integer,
    Symbol  = M.Expression.Symbol,
    Real    = Symbol.Real,
    List    = M.Expression.List;

describe('e2e - Derivatives', function () {
    function functionEquality(a , b) {
        for(var i = -10; i < 10; i+= 3.2) {
            var A = a(i);
            var B = b(i);
            A.should.equal(B);
        }
    }
    describe($('d/dx sin x'), function () {
        it($('= cos x'), function () {
            var x = new Real('x');
            var expr = M('\\sin(x)', {x: x, sin: M.Global.sin});

            var d = expr.differentiate(x);
            d.should.be.an.instanceof(List.Real);
            d[0].should.equal(M.Global.cos);
            d[1].should.equal(x);
        })
    });

    describe($('d/dx sin (x * x)'), function () {
        it($('= 2x \\cdot cos x^2'), function () {
            var x = new Real('x');
            var expr = M('\\sin(x*x)', {x: x, sin: M.Global.sin});
            var d = expr.differentiate(x);
            d.should.be.an.instanceof(List.Real);

            should.not.exist(d[0].operator);

            d[0][0].should.equal(M.Global.cos);
            d[1].operator.should.equal('+');
            d[1][0].should.equal(x);
            d[1][1].should.equal(x);

            var fn = d.compile('x');

            functionEquality(fn, function (x) {return 2 * x * Math.cos(x * x)})
        });
    });

});
