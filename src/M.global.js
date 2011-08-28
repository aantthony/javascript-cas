
M.Context.prototype=Math;
M.Context.prototype.D=function(x, wrt){
	wrt=wrt||"x";
	return x.differentiate(wrt,1);
};
M.Context.prototype.D.symbolic=true;

M.Context.prototype.reset=function(){
	for(var i in this){
		if(this.hasOwnProperty(i)){
			delete this[i];
		}
	}
	return this;
};

var exp = Math.exp,
	log = Math.log;

//Riemann zeta function
function zeta(x) {
    if (x === 0) {
        return -0.5;
    } else if (x == 1) {
        return Infinity;
    } else if (x == 2) {
        return pi * pi / 6;
    } else if (x == 4) {
        return pi * pi * pi * pi / 90;
    } else if (x < 1) {
        return Infinity;
    }
    var sum = 4.4 * pow(x, -5.1);
    for (var npw = 1; npw < 10; npw++) {
        sum += pow(npw, -x);
    }
    return sum;
}

function gammln(xx) {
    var j;
    var x,tmp,y,ser;
    var cof=[57.1562356658629235,-59.5979603554754912,14.1360979747417471,-0.491913816097620199,0.339946499848118887e-4,0.465236289270485756e-4,-0.983744753048795646e-4,0.158088703224912494e-3,-0.210264441724104883e-3,0.217439618115212643e-3,-0.164318106536763890e-3,0.844182239838527433e-4,-0.261908384015814087e-4,0.368991826595316234e-5];
    if (xx <= 0){
        throw("bad arg in gammln");
    }
    y=x=xx;
    tmp = x+5.24218750000000000;
    tmp = (x+0.5)*log(tmp)-tmp;
    ser = 0.999999999999997092;
    for (j=0;j<14;j++){
        ser += cof[j]/++y;
    }
    return tmp+log(2.5066282746310005*ser/x);
}
function Gamma(x){
    if(x==0){
        return Infinity;
    }
    if(x<0){
        return -pi/(x*sin(pi*x)*Gamma(-x));
    }
    return exp(gammln(x));
}

function factorial(ff) {
    if (ff === 0 || ff == 1) {
        return 1;
    } else if (ff > 0 && ff == ~~ff && ff < 15) {
        var s = 1;
        for (var nns = 1; nns <= ff; nns++) {
            s *= nns;
        }
        return~~s;
    } else if (ff != (~~ff) || ff < 0) {
        return Gamma(ff + 1);
    }
}


M.Context.prototype.factorial = function(x){
	return factorial(x);
};
//M.Context.prototype.factorial.symbolic = true;


M.Context.prototype.Gamma = function(x){
	return Gamma(x);
}
//M.Context.prototype.Gamma.symbolic = true;

//Like jquery noConflict
M.noConflict = function() {
	window.M=_M;
	return M;
};

M.Context.prototype.Infinity=Infinity;

M.Context.prototype.NaN=NaN;



M.global = new M.Context();
