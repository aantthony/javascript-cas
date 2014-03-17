var should = require('should'),
    $ = require('../$'),
    M = require('../../'),
    Rational = M.Expression.Rational;
    Symbol = M.Expression.Symbol;

describe($('x \\in \\Rational'), function () {
    var x, y, zero;
    before(function () {
        x = new Rational(12, 19);
        y = new Rational(3, 5);
        zero = new Rational(0, 1);
    });
    describe('Parser', function () {
        var n;
        before(function () {
            n = M('32.235');
        });
        it($('x \\in \\Rational'), function () {
            n.should.be.an.instanceof(Rational)
        });
        it($('x = x'), function () {
            (n.a / n.b).should.equal(32.235);
            var fb = Math.floor(n.b);
            fb.should.equal(n.b);
        });
        it('should reduce the fraction as much as possible', function () {
            for(var i = 2; i <= n.a; i++) {
                if (n.a % i === 0 && n.b % i === 0) {
                    throw new Error('Common factor of ' + i);
                }
            }
        })
        it('compiles correctly', function () {
            n.compile()().should.equal(32.235);
        });
    });

    describe($('x \\cdot y'), function () {
        
        var z;
        before(function () {
            z = (x)['*'](y);
        });
        describe('= 0', function () {
            it($('\\if x = 3'), function () {
                var z = zero['*'](new Rational(3));
                z.a.should.equal(0);
            });
            it($('\\if x = c'), function () {
                var z = zero['*'](new Symbol.Real());
            });
        });
        it($('\\in \\Rational'), function () {
           z.should.be.an.instanceof(Rational);
        });
        it('evaluates correctly', function () {
            var n = x.a * y.a;
            var m = x.b * y.b;
            var _m = Math.floor(z.b);
            _m.should.equal(z.b);

            (z.a/z.b).should.equal(n/m);
        });
        it($('= y \\cdot x'), function () {
            var A = z.compile()();
            var B = (y)['*'](x).compile()();
            A.should.equal(B);
        });
    });

    describe($('x + y'), function () {
        var z;
        before(function () {
            z = (x)['+'](y);
        });
        describe('= 0', function () {

        });
        it($('\\in \\Rational'), function () {
            z.should.be.an.instanceof(Rational);
        });
        it($('= y + x'), function () {
            var A = z.compile()();
            var B = (y)['+'](x).compile()();
            A.should.equal(B);
        });
        it('evaluates correctly', function () {
            var d = Math.floor(z.b);
            d.should.equal(z.b);

            var n = Math.floor(z.a);
            n.should.equal(z.a);
            
            (z.a / z.b - ((x.a/x.b) + (y.a/y.b)) < 0.0001).should.be.true;
        });
    });

    describe($('x / y'), function () {
        var z;
        before(function () {
            z = (x)['/'](y);
        });

        describe('= 0', function () {
            it($('\\if x = 0'), function () {

            });
        });
        it($('\\in \\Rational'), function () {
            z.should.be.an.instanceof(Rational);
        });
        it('evaluates correctly', function () {
            var d = Math.floor(z.b);
            d.should.equal(z.b);

            var n = Math.floor(z.a);
            n.should.equal(z.a);

            (z.a / z.b - (x.a/x.b)/(y.a/y.b) < 0.0001).should.be.true;
        });
        it('compiles correctly', function () {
            var r = z.compile()();
            (r - (x.a/x.b)/(y.a/y.b) < 0.00001).should.be.true;
        });
    });
    describe($('x ^ 5'), function () {
        it('should compile to a fragment shader', function () {
            var m = M('x^5');
            m.s('x-shader/x-fragment');
        });
    });
    describe($('1 / (x / y)'), function () {
        var n;
        before(function () {
            n = M('1 / (1234 / 4321)');
        });
        it($('\\in \\Rational'), function () {
            n.should.be.an.instanceof(M.Expression.Rational);
        });
        it($('= y / x'), function () {
            n.a.should.equal(4321);
            n.b.should.equal(1234);
        });
    });
});
