var should = require('should'),
    sinon = require('sinon'),
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
            var d = z.differentiate(x);
            should.exist(d);
            d.should.be.an.instanceof(Integer);
            d.a.should.equal(1);
        })
    });
    describe($('d/dy z'), function () {
        it($('= 1'), function () {
            var d = z.differentiate(y);
            d.should.be.an.instanceof(Integer);
            d.a.should.equal(1);
        })
    });
    describe($('d/dw z'), function () {
        it($('= 0'), function () {
            var d = z.differentiate(new Symbol.Real());
            should.exist(d);
            d.should.be.an.instanceof(Integer);
            d.a.should.equal(0);
        })
    });
});


describe($('z = x * y \\in \\List.Real'), function () {
    var x, y, z;
    before(function () {
        x = context.x = new Real('x');
        y = context.y = new Real('y');
        z = new List.Real([x,y], '*');
    });

    describe($('d/dx z'), function () {
        it($('= y'), function () {
            var d = z.differentiate(x);
            should.exist(d);
            d.should.equal(y);
        })
    });
    describe($('d/dy z'), function () {
        it($('= x'), function () {
            var d = z.differentiate(y);
            should.exist(d);
            d.should.equal(x);
        })
    });
    describe($('d/dw z'), function () {
        it($('= 0'), function () {
            var d = z.differentiate(new Symbol.Real());
            should.exist(d);
            d.should.be.an.instanceof(Integer);
            d.a.should.equal(0);
        })
    });
});

describe($('z = f * g \\in \\List.Real'), function () {

    var x = new Real('x');
    var y = new Real('y');
    var zero = new Integer(0);

    function mock() {
        return Object.create(List.Real.prototype);
    }

    var f  = mock(); var g  = mock();
    var fx = mock(); var gx = mock();
    var fy = mock(); var gy = mock();

    var z = new List.Real([f, g], '*');

    f.differentiate = function (k) {
        return k === x ? fx
            :  k === y ? fy
            :  zero;
    };
    g.differentiate = function (k) {
        return k === x ? gx
            :  k === y ? gy
            :  zero;
    };

    var z;

    beforeEach(function () {

        sinon.spy(f, 'differentiate');
        sinon.spy(g, 'differentiate');
    
        sinon.spy(f,  '*'); sinon.spy(g,  '*');
        sinon.spy(fx, '*'); sinon.spy(gx, '*');
        sinon.spy(fy, '*'); sinon.spy(gy, '*');

    });

    afterEach(function () {
        f.differentiate.restore();
        g.differentiate.restore();
         f['*'].restore();  g['*'].restore();
        fx['*'].restore(); gx['*'].restore();
        fy['*'].restore(); gy['*'].restore();
    });

    before(function () {
        z = new List.Real([f, g], '*');
        z.should.be.an.instanceof(M.Expression);
    });
    describe($('2 * z'), function () {
        it('evaluates correctly', function () {
            var two = new Integer(2);
            var q = z['*'](two);
            // var q = new List.Real([z,two], '*')
            q.should.be.an.instanceof(List.Real);
            // q.operator.should.equal('*');
            // q[0].operator.should.equal('*');

            // q[0][0].should.equal(two);

        });
        it(' = z * 2', function () {
            var two = new Integer(2);
            var q = two['*'](z);
            q.should.be.an.instanceof(List.Real);
            // q.operator.should.equal('*');

        });
    });

    describe($('d/dx z'), function () {
        it($("= f' \\cdot g + g' \\cdot f"), function () {
            var d = z.differentiate(x);
            should.exist(d);
            d.should.be.an.instanceof(List.Real);
            d.operator.should.equal('+');

            // d.length.should.equal(2);
            // console.log(d[0]);
            // d[0].operator.should.equal('*');
            // d[1].operator.should.equal('*');

            // f['*'].calledOnce();

        })
    });

});
