var should = require('should'),
    sinon = require('sinon'),
    $ = require('../$'),
    M = require('../../'),
    match = require('../match'),
    Integer = M.Expression.Integer,
    Symbol  = M.Expression.Symbol,
    Real    = Symbol.Real,
    List    = M.Expression.List;

describe('Differential', function () {
    it.skip('should be parsed correctly', function () {
      
    });
    describe($('\\nabla'), function () {
      var del, x;
      beforeEach(function () {
        var d = M('d');
        x = M('(x,y,z)');
        del = d['/'](d.default(x));
      });

      it($('(x) = 3'), function () {
        match(del.default(x), M('3'), 'x');
      });
      it($('(x.i) = (1,0,0)'), function () {
        del.default(x.unbound.x).compile()().join(',').should.equal('1,0,0');
      });

    });
    
});
