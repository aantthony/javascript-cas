Expression.Complex = function(real, imag) {
	this._real = real;
	this._imag = imag;
};

Expression.Complex.prototype = Object.create(Expression.Constant.prototype);
Expression.Complex.prototype.real = function() {
	return new Expression.NumericalReal(this._real);
};
Expression.Complex.prototype.imag = function() {
	return new Expression.NumericalReal(this._imag);
};
Expression.Complex.prototype.realimag = function() {
	return Expression.List.ComplexCartesian([
		new Expression.NumericalReal(this._real),
		new Expression.NumericalReal(this._imag)
	]);
};
Expression.Complex.prototype.conjugate = function() {
	return new Expression.Complex(this._real, -this._imag);
};
(function(){
	var one_on_rt2 = 1/Math.sqrt(2);
	Expression.Complex.prototype.apply = function(operator, x) {
		switch (operator){
			case "^":
				if(this._real === 0 && this._imag === 0) {
					return Global.Zero; // Contradicts x^0 = 1
				}
				break;
			case "+":
				if(this._real === 0 && this._imag === 0) {
					return x;
				}
				break;
			case "-":
				if(this.value === 0) {
					return x.apply('@-');
				}
				break;
			case "*":
				if(this._real === 1 && this._imag === 0){
					return x;
				}
				//Note: There is not meant to be a break here.
			case "/":
				if(this._real === 0 && this._imag === 0){
					return Global.Zero; //Contradics x/0 = Infinity
				}
		}
		if (operator === ",") {
			return Expression.Vector([this, x]);
		} else if (x === undefined) {
			switch (operator) {
				
				case "@+":
					return this;
				case "@-":
					return new Expression.Complex(-this._real, -this._imag);
				case "\u221A":
					throw("OLD SQRT. New one is a function, not operator.")
					return new Expression.Complex(p, q);
				case "++":
				case "--":
					throw(new TypeError("Postfix " +operator + " operator applied to value that is not a reference."));
				case "+=":
				case "-=":
				case "*=":
				case "/=":
					throw(new ReferenceError("Left side of assignment is not a reference."));
				case "!":
					return Global.Gamma.apply(undefined, new Expression.Complex(this._real + 1, this._imag));
			}
		} else if (x.constructor === Expression.NumericalReal) {
			switch (operator) {
				case "*":
				case undefined:
					return new Expression.Complex(this._real * x.value, this._imag * x.value);
				case "+":
					return new Expression.Complex(this._real + x.value, this._imag);
				case "-":
					return new Expression.Complex(this._real - x.value, this._imag);
				case "/":
					return new Expression.Complex(this._real / x.value, this._imag / x.value);
				case "^":
					var a = this._real;
				    var b = this._imag;
				    var c = x.value;

				    var hlm = 0.5 * Math.log(a*a + b*b);
				    var theta = Math.atan2(b, a);
				    var hmld_tc = theta * c;
				    var e_hmlc_td = Math.exp(hlm * c);
                    return new Expression.Complex(
                        (e_hmlc_td * Math.cos(hmld_tc)),
				        (e_hmlc_td * Math.sin(hmld_tc))
                    );
				default:
			}
		} else if (x.constructor === this.constructor) {
			switch (operator) {
				case '*':
				case undefined:
					// (a+bi)(c+di) = (ac-bd) + (ad+bc)i 
					return new Expression.Complex(this._real * x._real - this._imag * x._imag, this._real * x._imag + this._imag * x._real);
				case '+':
					return new Expression.Complex(this._real + x._real, this._imag + x._imag);
				case '-':
					return new Expression.Complex(this._real - x._real, this._imag - x._imag);
				case '/':
					//	(a+bi)/(c+di) 
					//= [(a+bi)(c-di)]/[(c+di)(c-di)]
					//= [(a+bi)(c-di)]/[cc + dd]
					//=	[ac -dai +bci + bd]/[cc+dd]
					//= [ac + bd + (bc - da)]/[cc+dd]
					var cc_dd = x._real * x._real + x._imag * x._imag;
					return new Expression.Complex((this._real * x._real + this._imag * x._imag)/cc_dd, (this._imag * x._real - this._real*x._imag)/cc_dd);
				case '^':
				    /*
				        (a+bi)^(c+di)
				        = (e^(log(a+bi))) ^ (c+di)
				        = e^(log(a+bi) * (c+di))
				        = e^p
				        [g =  Math.Atan2(b, a)]
				        [l = (0.5 * Math.Log(Norm(a+bi))) + i g]
				        [p = l * (c+di)]
				        [s = e^(Re[p])]
				        [k = Im[p]]
				        = s * Math.Cos(k) + i  (s * Math.Sin(k))
				        
				    */
				    /*
				    var g = Math.atan2(b, a);
				    var l = [0.5 * Math.Log(a*a + b*b), g];
				    var p = [l[0] * c - l[1] * d, l[0] * d + l[1] * c];
				    var s = Math.exp(p[0]);
				    var k = p[1];
					return new Expression.Complex(s*Math.cos(k), s*Math.sin(k));
				    
				    //
				    [
				        (Math.exp(0.5 * Math.log(a*a + b*b) * c - Math.atan2(b, a) * d)*Math.cos(0.5 * Math.log(a*a + b*b) * d + Math.atan2(b, a) * c)),
				        (Math.exp(0.5 * Math.log(a*a + b*b) * c - Math.atan2(b, a) * d)*Math.sin(0.5 * Math.log(a*a + b*b) * d + Math.atan2(b, a) * c))
				    ]
				    */
				    var a = this._real;
				    var b = this._imag;
				    var c = x._real;
				    var d = x._imag;

				    var hlm = 0.5 * Math.log(a*a + b*b);
				    var theta = Math.atan2(b, a);
				    var hmld_tc = hlm * d + theta * c;
				    var e_hmlc_td = Math.exp(hlm * c - theta * d);
                    return new Expression.Complex(
                        (e_hmlc_td * Math.cos(hmld_tc)),
				        (e_hmlc_td * Math.sin(hmld_tc))
                    );
				    /*
				    [
				        (e_hmlc_td*Math.cos(hmld_tc)),
				        (e_hmlc_td*Math.sin(hmld_tc))
				    ]
				    
				    e_hmlc_td =  Math.exp(hlm * c - theta * d);
				              =  Math.exp(x-y)
				              =  Math.exp(x)/Math.exp(y)
				              =  Math.exp(hlm * c - theta * d) / Math.exp(theta * d)
				              =  Math.exp(0.5 * Math.log(a*a + b*b) * c) / Math.exp(theta * d)
				              =  Math.pow(a*a + b*b, 0.5*c) / Math.exp(theta*d)
				    
				    */
                    /*
                        \log(a+b)=\log(a(b/a+1))=\log(a) + log(b/a+1)
                    */
				default:
			}
		} else if(x.constructor === Expression.List.ComplexCartesian) {
			return this.realimag().apply(operator, x);
		} else if(x.constructor === Expression.List.ComplexPolar) {
			return this.polar().apply(operator, x);
		}
		console.error("cmplx . " + operator + " => E.List?");
		/*
		if(this._real === 0.0 && this._imag === 0.0){
			return this;
		}
		*/
		
		
		
		return Expression.List([this, x], operator);
	}
	
}());

Expression.Complex.prototype.constructor = Expression.Complex;