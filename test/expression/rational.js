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
        it($('x = x'));
        it('compiles correctly');
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
