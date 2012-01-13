Expression.Complex = function(real, imag){
	this._real = real;
	this._imag = imag;
};

Expression.Complex.prototype = Object.create(Expression.Scalar.prototype);
Expression.Complex.prototype.real = function(){
	return this._real;
};
Expression.Complex.prototype.imag = function(){
	return this._imag;
};
Expression.Complex.prototype.conjugate = function(){
	return new Expression.Complex(this._real, -this._imag);
};
(function(){
	var one_on_rt2 = 1/Math.sqrt(2);
	Expression.Complex.prototype.apply = function(operator, x){
		if(operator === "\u221A"){
			//http://www.mathpropress.com/stan/bibliography/complexSquareRoot.pdf
			var sgn_b;
			if(this._imag === 0.0){
				return new Expression.Complex(Math.sqrt(this._real), 0);
			}else if(this._imag>0){
				sgn_b = 1.0;
			}else{
				sgn_b = -1.0;
			}
			var s_a2_b2 = Math.sqrt(this._real * this._real + this._imag * this._imag);
			var p = one_on_rt2 * Math.sqrt(s_a2_b2 + this._real);
			var q = sgn_b * one_on_rt2 * Math.sqrt(s_a2_b2 - this._real);
			return new Expression.Complex(p, q);
		}

		if(x.constructor === this.constructor){
			switch(operator){
				case '*':
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
		}
		/*
		if(this._real === 0.0 && this._imag === 0.0){
			return this;
		}
		*/

		return ExpressionWithArray([this, x], operator);
	}
	
}());

Expression.Complex.prototype.valueOf = function(){
	return this.abs()._real;
};

Expression.Complex.prototype.toString = function(){
	return this._real.toString() + ' + ' + this._imag.toString()+'i';
};
Expression.Complex.prototype.constructor = Expression.Complex;