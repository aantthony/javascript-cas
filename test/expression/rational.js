var should = require('should'),
    $ = require('../$'),
    M = require('../../'),
    Rational = M.Expression.Rational;

describe($('x \\in \\Rational'), function () {
    describe('Parser', function () {
        var n = M('32.235');
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
        describe('= 0', function () {
            it($('\\if x = 3'));
            it($('\\if x = c'));
        });
        it($('\\in \\Rational'));
        it($('= y \\cdot x'));
        it('evaluates correctly');
    });

    describe($('x + y'), function () {
        describe('= 0', function () {

        });
        it($('\\in \\Rational'));
        it($('= y + x'));
        it('evaluates correctly');
    });

    describe($('x / y'), function () {
        describe('= 0', function () {
            it($('\\if x = 0'));
        });
        it($('\\in \\Rational'));
        it('evaluates correctly');
        it('compiles correctly');
    });

    describe($('1 / (x / y)'), function () {
        var n = M('1 / (1234 / 4321)');
        it($('\\in \\Rational'), function () {
            n.should.be.an.instanceof(M.Expression.Rational);
        })
    });
});
