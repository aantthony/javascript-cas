var should = require('should'),
    sinon = require('sinon'),
    $ = require('../$'),
    M = require('../../'),
    match = require('../match'),
    Integer = M.Expression.Integer,
    Symbol  = M.Expression.Symbol,
    Real    = Symbol.Real,
    List    = M.Expression.List;

describe($('x % y'), function () {
    var x, y, z;
    before(function () {
        x = context.x = new Real('x');
        y = context.y = new Real('y');
        z = new List.Real([x,y], '%');
    });

    it($('= [js] x % 1.2, when y = 1.2'), function () {
        var z = new List.Real([x,new Real(1.2)], '%');
        match(z, function (x) { return x % 1.2; }, 'x');
    });


    it($('= [glsl] mod(x, 1.2), when y = 1.2'), function () {
        var z = new List.Real([x,new Real(1.2)], '%');
        var glsl = z.s('x-shader/x-fragment');
        glsl.s.should.equal('mod((x),(1.2))');
        // TODO: it should be like this
        // glsl.s.should.equal('mod(x,1.2)');
    });
});
