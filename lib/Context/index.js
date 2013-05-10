var util = require('util');

var globalContext = require('../global');

function Context() {

}
Context.prototype = Object.create(globalContext);

util.inherits(Context, {prototype: globalContext});

Context.prototype.reset = function () {
    this.splice(0);
};
