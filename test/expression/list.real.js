var should = require('should'),
    $ = require('../$'),
    M = require('../../'),
    Integer = M.Expression.Integer,
    Symbol  = M.Expression.Symbol,
    Real    = Symbol.Real,
    List    = M.Expression.List;

describe($('z = x + y \\in \\List.Real'), function () {
    var x, y, z;
    before(function () {
        x = context.x = new Real('x');
        y = context.y = new Real('y');
        z = new List.Real([x,y], '+');
    });

    describe($('d/dx z'), function () {
        it($('= 1'), function () {
            d = z.differentiate(x);
            d.should.be.an.instanceof(Integer);
            d.a.should.equal(1);
        })
    });
    describe($('d/dy z'), function () {
        it($('= 1'), function () {
            d = z.differentiate(y);
            d.should.be.an.instanceof(Integer);
            d.a.should.equal(1);
        })
    });
    describe($('d/dw z'), function () {
        it($('= 0'), function () {
            d = z.differentiate(new Symbol.Real());
            d.should.be.an.instanceof(Integer);
            d.a.should.equal(0);
        })
    });
});
