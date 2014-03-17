var should = require('should'),
    $ = require('../$'),
    M = require('../../'),
    Integer = M.Expression.Integer,
    Symbol  = M.Expression.Symbol,
    Real    = Symbol.Real;

describe($('x \\in \\Integer'), function () {
    describe('Parser', function () {
        var n;
        before(function () {
            n = M('32322');
        })
        it($('x \\in \\Integer'), function () {
            n.should.be.an.instanceof(Integer);
        });
        it($('x = x'), function () {
            n.a.should.equal(32322);
        });
        it('compiles correctly', function () {
            var fn = n.compile();
            var result = fn();
            result.should.equal(32322);
        });
    });


    var x = new Integer(32322);
    var y = new Integer(453);

    describe($('x \\cdot y'), function () {

        describe('= 0', function () {
            var zero;
            before(function () {
                zero = new Integer(0);
            });

            it($('\\if x = 3'), function () {
                var n = (new Integer(3))['*'](zero);
                var value = n.compile()();

                value.should.equal(0);
            });
            it($('\\if y = z'), function () {
                var n = zero['*'](new Real())
                var value = n.compile()();

                value.should.equal(0);
            });
            it($('\\if x = z'), function () {
                var n = new Real()['*'](zero);
                var value = n.compile()();

                value.should.equal(0);
            });
        });

        it($('\\in \\Integer'), function () {
            (x)['*'](y)
            .should.be.an.instanceof(Integer);
        });

        it($('= y \\cdot x'), function () {
            var n = (x)['*'](y)
            var m = (y)['*'](x)

            n.should.be.an.instanceof(Integer);
            m.should.be.an.instanceof(Integer);
            n.a.should.equal(m.a);
        });
        it('evaluates correctly', function () {
            var n = M('32322 * 12');
            n.a.should.equal(32322 * 12);
        });
    });

    describe($('x + y'), function () {
        describe('= 0', function () {
            it($('\\if y = -x'), function () {
                var zero = M('3 - 3');
                var value = zero.compile()();

                value.should.equal(0);
            });
        });
        it($('\\in \\Integer'), function () {
            var n = (x)['+'](y);
            n.should.be.an.instanceof(Integer);
        });
        it($('= y + x'), function () {
            var n = (x)['+'](y);
            var m = (y)['+'](x);

            n.should.be.an.instanceof(Integer);
            m.should.be.an.instanceof(Integer);
            n.a.should.equal(m.a);
        });
        it('evaluates correctly', function () {
            var n = (x)['+'](y);
            n.a.should.equal(x.a + y.a);
        });
    });

    describe($('x / y'), function () {
        describe('= 0', function () {
            it($('\\if x = 0'), function () {
                var zero = M('0 / 8');
                var value = zero.compile()();

                value.should.equal(0);
            });
        });
        it($('\\in \\Rational'), function () {
            var n = (x)['/'](y);
            n.should.be.an.instanceof(M.Expression.Rational);
        });
        it('evaluates correctly', function () {
            var n = (x)['/'](y);
            n.a.should.equal(x.a);
            n.b.should.equal(y.a);
        });
        it('compiles correctly', function () {
            var n = (x)['/'](y);
            var fn = n.compile();
            fn().should.equal(x.a / y.a);
        });
    });
});
