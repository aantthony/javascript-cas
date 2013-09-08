var should = require('should'),
    $ = require('../$'),
    M = require('../../'),
    match = require('../match'),
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
    describe($('1 - x'), function () {
        it($('= 1 - x'), function () {
            var d = M('1 - x');
            match(d, function (x) {
                return 1 - x;
            }, 'x');
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

    describe($('sin^2(0)'), function () {
        it($('= 0'), function () {
            var expr = M('\\sin^2 (0)');
            expr.should.be.an.instanceof(M.Expression.NumericalReal);
            expr.value.should.equal(0);
        })
    });

    describe($('sin^2(1)'), function () {
        it($('= 0'), function () {
            var expr = M('\\sin^2 (1)');
            expr.should.be.an.instanceof(M.Expression.NumericalReal);
            expr.value.should.equal(Math.sin(1) * Math.sin(1));
        })
    });

    describe('Built in global.Math function:', function () {

        ['sin', 'cos', 'tan'].forEach(function (fn) {
            var latex = '\\' + fn + '(x)';
            describe($(latex), function () {
                it($('= Math.' + fn + '(x)'), function () {
                    var expr = M(latex);
                    match(expr, Math[fn], 'x');
                });
            });
        })

    })

    describe('Compilation factors', function () {
        describe($('(x-2)^3'), function () {
            var expr;
            before(function () {
                expr = M('(x-2)^3');
            });

            it('should compile correctly to javascript', function () {
                match(expr, function (x) {
                    var k = x - 2;
                    return k * k * k;
                }, 'x');
            });
            it('should compile correctly to GLSL', function () {
                var glsl = expr.s('x-shader/x-fragment');
                glsl.pre.length.should.equal(1);
            });
            

        });
    });
});
