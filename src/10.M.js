function M(a, b){
	return new Expression(a, b);
}

M.toString=function(){
	//Yes, this is necessary
	return "function M() {\n    [awesome code]\n}";
};

window.M = M;
