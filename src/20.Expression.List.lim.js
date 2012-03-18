Expression.List.prototype.lim = function (x, y) {
	switch (this.operator) {
		case '+':
		case '-':
			return this[0].lim(x, y)[this.operator](this[1].lim(x, y));
		case '@-':
		case '@+':
			return this[0].lim(x, y)[this.operator]();
		case '/':
			var top = this[0].sub(x, y);
			var bottom = this[1].sub(x, y);
			if (top === Global.Zero && bottom === Global.Zero) {
				top = this[0].differentiate(x);
				bottom = this[1].differentiate(x);
				return top['/'](bottom).lim(x, y);
			}
			return top['/'](bottom);
		case '*':
			var a = this[0].sub(x, y);
			var b = this[1].sub(x, y);
			if (a === Global.Zero && b == Global.Infinity) {
				var top = this[0].differentiate(x);
				var bottom = Global.One['/'](this[1]).differentiate(x);
				return top['/'](bottom).lim(x, y);
			} else if(b === Global.Zero && a == Global.Infinity) {
				var top = this[0].differentiate(x);
				var bottom = Global.One['/'](this[1]).differentiate(x);
				return top['/'](bottom).lim(x, y);
			}
			return a['*'](b);
		case '^':
			if(this[0] === Global.Zero) {
				return Global.Zero;
			}
			if(this[1] === Global.Zero) {
				if(this[0] !== Global.Zero) {
					return Global.One;
				}
			}
			return this.sub(x, y);
		case '!':
			return this.sub(x, y);
	}
};