var should = require('should'),
    $ = require('../$'),
    M = require('../../'),
    Integer = M.Expression.Integer,
    Symbol  = M.Expression.Symbol,
    Real    = Symbol.Real,
    List    = M.Expression.List;

describe($('Symbol x \\in \\Real'), function () {
    var x, y, context = {};
    before(function () {
        x = context.x = new Real('x');
        y = context.y = new Real('y');
    });
    describe('Parser', function () {
        var n;
        before(function () {
            n = M('x', {});
        })
        it($('x \\in \\Symbol'), function () {
            n.should.be.an.instanceof(Symbol);
        });
        it($('x \\in \\Real'), function () {
            n.should.be.an.instanceof(Real);
        });
        it('is a free variable', function () {
            n.unbound.should.have.property('x');
            n.unbound.x.should.equal(n);
        });
        it($('x = x'), function () {
            n.symbol.should.equal('x');
        });
        it('compiles the identity function correctly', function () {
            var fn = n.compile('x');
            var x = {};
            var result = fn(x);
            result.should.equal(x);
        });
        it('binds to the context', function () {
            var s = M('x', context);
            s.should.equal(context.x);
            s.bound.should.have.property('x');
            s.bound.x.should.equal(context.x);
        })
    });


    describe($('x \\cdot y'), function () {

        it($('\\in \\List.Real'), function () {
            (x)['*'](y)
            .should.be.an.instanceof(List.Real);
        });

        it($('= y \\cdot x'), function () {
            var n = (x)['*'](y)
            var m = (y)['*'](x)

            n.should.be.an.instanceof(List.Real);
            m.should.be.an.instanceof(List.Real);
            var v1 = n.compile('x,y')(3,5);
            var v2 = m.compile('x,y')(3,5);
            v1.should.equal(v2);
        });
        it('evaluates correctly', function () {
            var n = M('32322 * 12');
            n.a.should.equal(32322 * 12);
        });
    });

    describe($('x + y'), function () {
        var z;
        before(function () {
            z = (x)['+'](y);
        });
        describe('= 0', function () {
            it($('\\if y = -x'), function () {
                var zero = M('x - x');
                var value = zero.compile()();

                value.should.equal(0);
            });
        });
        it($('\\in \\List.Real'), function () {
            z.should.be.an.instanceof(List.Real);
        });
        it($('= y + x'), function () {
            var n = (x)['+'](y);
            var m = (y)['+'](x);

            n.should.be.an.instanceof(List.Real);
            m.should.be.an.instanceof(List.Real);
            
            var v1 = n.compile('x,y')(3,5);
            var v2 = m.compile('x,y')(3,5);
            v1.should.equal(v2);
        });
        it('evaluates correctly', function () {
            z.length.should.equal(2);
            z[0].should.equal(x);
            z[1].should.equal(y);
            z.should.have.property('operator');
            z.operator.should.equal('+');
        });
    });

    describe($('x / y'), function () {
        var z;
        before(function () {
            z = (x)['/'](y);
        })
        describe('= 0', function () {
            it($('\\if x = 0'), function () {
                var zero = M('0 / x');
                var value = zero.compile()();

                value.should.equal(0);
            });
        });
        it($('\\in \\List.Real'), function () {
            z.should.be.an.instanceof(List.Real);
        });
        it('evaluates correctly', function () {
            z.length.should.equal(2);
            z[0].should.equal(x);
            z[1].should.equal(y);
            z.should.have.property('operator');
            z.operator.should.equal('/');

        });
        it('compiles correctly', function () {
            var n = (x)['/'](y);
            var fn = n.compile('x,y');
            fn(1,2).should.equal(1/2);
        });
    });
    describe($('d/dx'), function () {
        describe($('x'), function () {
            var dx;
            before(function () {
                dx = x.differentiate(x);
            })

            it($('= 1'), function () {
                dx.should.be.an.instanceof(Integer);
                dx.a.should.equal(1);
            })
        })
        describe($('y'), function () {
            it($('= 0'), function () {
                var dy = y.differentiate(x);
                dy.should.be.an.instanceof(Integer);
                dy.a.should.equal(0);
            });
        });
        
    });
});
