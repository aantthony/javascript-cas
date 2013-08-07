var should = require('should'),
    $ = require('../$'),
    M = require('../../');

describe($('x \\in \\Integer'), function () {
    describe('Parser', function () {
        var n = M('32322');
        it($('x \\in \\Integer'), function () {
            n.should.be.an.instanceof(M.Expression.Integer);
        })
        it($('x = x'), function () {
            n.a.should.equal(32322);
        });
        it('compiles correctly', function () {
            var fn = n.compile();
            var result = fn();
            result.should.equal(32322);
        });
    });

    describe($('x \\cdot y'), function () {
        describe('= 0', function () {
            it($('\\if x = 3'), function () {
                var zero = M('3 * 0');
                var value = zero.compile()();

                value.should.equal(0);
            });
            it($('\\if x = c'), function () {
                var zero = M('c * 0');
                var value = zero.compile()();

                value.should.equal(0);
            });
        });
        it($('\\in \\Integer'), function () {
            var n = M('32322 * 12');
            n.should.be.an.instanceof(M.Expression.Integer);
        });
        it($('= y \\cdot x'), function () {
            var n = M('32322 * 12');
            var m = M('12 * 32322');

            n.should.be.an.instanceof(M.Expression.Integer);
            m.should.be.an.instanceof(M.Expression.Integer);
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
            var n = M('32322 + 12');
            n.should.be.an.instanceof(M.Expression.Integer);
        });
        it($('= y + x'), function () {
            var n = M('32322 + 12');
            var m = M('12 + 32322');

            n.should.be.an.instanceof(M.Expression.Integer);
            m.should.be.an.instanceof(M.Expression.Integer);
            n.a.should.equal(m.a);
        });
        it('evaluates correctly', function () {
            var n = M('32322 + 12');
            n.a.should.equal(32322 + 12);
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
            var n = M('323322 / 2422');
            n.should.be.an.instanceof(M.Expression.Rational);
        });
        it('evaluates correctly', function () {
            var n = M('32322 / 12');
            n.a.should.equal(32322);
            n.b.should.equal(12);
        });
        it('compiles correctly', function () {
            var n = M('32322 / 12');
            var fn = n.compile();
            fn().should.equal(32322 / 12);
        });
    });
});
