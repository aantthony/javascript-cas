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
    describe($('y -(x*x-3)'), function () {
        it($('= y - x^2 + 3'), function () {
            var fnA = M('y - (x^2 - 3)').compile('x,y');
            var fnB = function (x, y) {
                return y - (x*x - 3);
            };
            for(var x = 0; x < 4; x++) {
                for(var y = 0; y < 4; y++) {
                    fnA(x,y).should.equal(fnB(x,y));
                }
            }
        });
    });
    describe($('1 - x'), function () {
        it($('= 1 - x'), function () {
            var d = M('1 - x');
            match(d, function (x) {
                return 1 - x;
            }, 'x');
        })
    });
    describe($('2\\cdot3'), function () {
        it($('= 6'), function () {
            match(M('2 * 3'), Number.prototype.valueOf.bind(6));
            match(M('2\\cdot3'), Number.prototype.valueOf.bind(6));
        });
    });
    describe($('0.3'), function () {
        it($('= 0.3'), function () {
            match(M('0.3'), Number.prototype.valueOf.bind(0.3));
        });
        it($('x = 0.3 * x'), function () {
            match(M('0.3x'), function (x) { return 0.3 * x; }, 'x');
        });
        it($('*x = 0.3 * x'), function () {
            match(M('0.3*x'), function (x) { return 0.3 * x; }, 'x');
        });
    })
    describe($('d/dw (1)'), function () {
        it($('= 0'), function () {
            var expr = M('\\frac{d}{dx} (1)');
            var d = expr.differentiate(new Symbol.Real());
            d.should.be.an.instanceof(Integer);
            d.a.should.equal(0);
        })
    });


    describe($('sec(0)'), function () {
        it($('= 1'), function () {
            var expr = M('\\sec (0)');
            expr.should.be.an.instanceof(M.Expression.NumericalReal);
            expr.value.should.equal(1);
        });
    });

    describe($('cosec(π / 2)'), function () {
        it($('= 1'), function () {
            var expr = M('\\cosec (\\pi / 2)');
            expr.should.be.an.instanceof(M.Expression.NumericalReal);
            expr.value.should.equal(1);
        })
    });

    describe.skip($('sin^2(0)'), function () {
        it($('= 0'), function () {
            var expr = M('\\sin^2 (0)');
            expr.should.be.an.instanceof(M.Expression.NumericalReal);
            expr.value.should.equal(0);
        })
    });

    describe.skip($('sin^2(1)'), function () {
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
