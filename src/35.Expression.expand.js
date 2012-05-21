Expression.List.prototype.expand = function(vars) {
	var right = 1;
	var left = -1;
	var L = Global.Zero;
	var R = Global.Zero;
	throw("Should be async, don't use this");
	
	if (this[1] instanceof Expression.List) {
		if (this.operator === '+' || this.operator === '-') {
			return this[0].expand(vars)[this.operator](this[1].expand(vars));
		}
		if (this.operator === '*' ) {
			var a = this[0].expand(vars);
			var b = this[1].expand(vars);
			a.terms(vars,
				function (y) {
					L = L['+'](y);
				},
				function (n) {
					R = R['+'](y);
				}
			);
			a.terms(vars,
				function (y) {
					L = L['+'](y);
				},
				function (n) {
					R = R['+'](y);
				}
			);
			
			
		}
	} else {
		return this;
	}
	//Use distributive law
};
