
//TODO: this is a bit messy. Maybe make it in the global, 
// and that way if it can be determined if it was/is consistent.
M.assumptions=true;
M.getAssumptions=function(){
	var x=M.assumptions;
	M.assumptions=true;
	return x;
	
};

M.assume=function(x){
	M.assumptions=M.assumptions.apply("&&", x);
};