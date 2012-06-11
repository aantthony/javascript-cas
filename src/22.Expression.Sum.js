Expression.Sum = function Summation(x, a, b, f_unbound) {
	this.x = x;
	this.f = f_unbound;
	this.a = a;
	this.b = b;
};
_ = Expression.Sum.prototype = Object.create(Expression.Symbol.prototype);
_.constructor = Expression.Sum;

_.s = function (lang) {
	if (lang === 'text/latex') {
		var cf = this.f.s(lang);
		var ca = this.a.s(lang);
		var cb = this.b.s(lang);
		var cx = this.x.s(lang);
		var cf_s = cf.s;
		var c = cf;
		c = cf.merge(ca);
		c = cf.merge(cb);
		return c.merge(cx, '\\sum_{' + cx.s + '=' + ca.s + '}^{' + cb.s + '}' + cf_s, language.precedence('*'));
	}
	if (lang === 'text/javascript') {

		var ca = this.a.s(lang);
		var cb = this.b.s(lang);
		if(!(this.x instanceof Expression.Symbol.Real)) {
			throw('Can only sum over reals in javascript');
		}



		var cx = this.x.s(lang);
		
		var c = cx.merge(ca).merge(cb);
		//c = c.merge(cx);
		
		// Need a summation variable, allocate one:
		var sv = c.var();
		// Total sum value:
		var ts = c.var();

		// Upper limit, (since javascript will recalculate it every time)
		var ul = c.var();
		
		var ll = c.var();
		

		var f_subbed = this.f.sub(this.x, new Expression.Symbol.Real(sv));
		var cf = f_subbed.s(lang);
		
		
		var sumcode = 'var ' + ts + ' = 0, ' + sv + ', ' + ll + ' = ' + ca.s +  ', ' + ul + ' = ' + cb.s + ';\nif(' + ul + ' === Infinity) {\n\t' + ul + ' = 1000;\n}\nif (!(' + ul + ' >= ' + ll + ')) {\n\tthrow("Halting problem solved.")\n}\nfor(' + sv + ' = ' + ll + '; ' + sv + ' < ' + ul +  '; ' + sv + '++) {\n\t' + ts + ' +=' + cf.s + ';\n}\n';
		return c.merge(cf, ts, Infinity, sumcode);
	}
};
_['^'] = function (x) {
	if(this.b_locked) {
		throw('Sum was upper bounded twice!');
	}
	this.b = x;
	this.b_locked = true;
	return this;
};
_.default = function (x) {
	if(!this.b_locked) {
		throw('Sum was not upper bounded!');
	}
	if(this.f_locked) {
		throw('Sum already defined');
	}
	this.f = x;
	this.f_locked = true;
	return this;
};