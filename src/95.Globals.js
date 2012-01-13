Global.e = Global.E;
Global.pi = Global.PI;
Global.sin.diff = function(x, n){
	
};
Global.Zero = new Expression.Numerical(0,0);
Global.One = new Expression.Numerical(1,0);
Global.i = new Expression.Symbol('i');
Global.i.real = Global.i.differentiate = function(){
    return Global.Zero;
};
Global.i.imag = function(){
    return Global.One;
};
