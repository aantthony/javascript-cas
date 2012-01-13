Expression.prototype.real = function(){
    switch(this.operator){
        case undefined:
            throw("Unknown Expression .real()");
        case '+':
        case '-':
            return this[0].real().apply(this.operator, this[1].real());
        case '*':
            // (a+bi)(c+di) = ac - bd + i(ad+bc)
        
    }
};
Expression.prototype.realimag = function(){
    switch(this.operator){
        case undefined:
            return [this.real(), this.imag()];
        case '+':
        case '-':
            var a = this[0].realimag();
            var b = this[1].realimag();
            return [
                a[0].apply('+',b[0]),
                a[1].apply('+',b[1])
            ];
        case '*':
            var a = this[0].realimag();
            var b = this[1].realimag();
            return [
                a[0].apply('*',b[0]).apply('-', a[1].apply('*',b[1])),
                a[0].apply('*',b[1]).apply('+',a[1].apply('*',b[0]))
            ];
        case '/':
            var a = this[0].realimag();
            var b = this[1].realimag();
            var cc_dd = b[0].apply('*',b[0]).apply('+',b[1].apply('*',b[1]));
			return [
			    (a[0].apply('*',b[0]).apply('+',a[1].apply('*',b[1]))).apply('/', cc_dd),
			    (a[1].apply('*',b[0]).apply('-',a[0].apply('*',b[1]))).apply('/', cc_dd)
			];
		case '^':
            var a = this[0].realimag();
            var b = this[1].realimag();
            
            var half = new Expression.Numerical(0.5, 0);
            var hlm = half.apply('*', Math.log(a[0].apply('*', a[0]).apply('+', a[1].apply('*',a[1]))));
		    var theta = Math.atan2(a[1], a[0]);
		    var hmld_tc = hlm.apply('*', b[1]).apply('+', theta.apply('*', b[0]));
		    var e_hmlc_td = Math.exp(hlm.apply('*',b[0]).apply('-', theta.apply('*', b[1])));
		    
            return [
                (e_hmlc_td.apply('*',Math.cos(hmld_tc))),
		        (e_hmlc_td.apply('*',Math.sin(hmld_tc)))
            ];
		    
    }
};
Expression.prototype.imag = function(){
	
};
