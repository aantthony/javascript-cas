Language.prototype._build = function(){
	var operators = this.operators;
	var token_types = {
		string: 1,
		number: 2,
		operator: 3,
		comment: 4,
		paren: 5,
    	symbol: 6
	};
	var nummustbe = "1234567890.";
	var operator_str_list = ["+","-","*","/","^", "++"];
	var parenmustbe = "([{}\"])";
	var varcannotbe = operator_str_list.join("") + parenmustbe + nummustbe;
	var match = [
	    function none(){
	        throw("NONE");
	    },
		function string(x){
			return false;
		},
		function number(x){
			return nummustbe.indexOf(x[x.length-1]) !== -1;
		},
		function operator(x){
			return operator_str_list.indexOf(x) !== -1;
		},
		function comment(x){
			return x[x.length-1] === " ";
		},
		function paren(x){
			return (x.length == 1) && (parenmustbe.indexOf(x) != -1);
		},
		function symbol(x){
		    return /^[A-Za-z]$/.test(x[x.length-1]);
		}
	];
	var names = match.map(function(e){return e.name;});
	this.parse = function (s, output) {
		
		function next_token(str, t){
		    if(t === token_types.comment){
		        console.log('/*' + str + '*/');
		        return;
		    }
		    console.log(t, names[t],str);
		}
		var i = 0;
		var l = s.length;
		var current_token = s[0];
		var t;
		for (t = 1; t < 7; t++) {
			if (match[t](current_token)) {
				break;
			}
		}
        for(i=1;i<l;i++){
            var ds = s[i];
            var cds = current_token + ds;
            if(match[t](cds)){
                current_token = cds;
            }else{
                var nt;
                for(nt = 1; nt < 7; nt++){
                    if(match[nt](ds)){
                        break;
                    }
                }
                next_token(current_token, t);
                t = nt;
                current_token = ds;
            }
            
        }
        console.log("last: ");
        next_token(current_token, t);
		//Stack of tokens for the shunting yard algorithm
		var stack = [];
		//Stack of tokens for RPN notation. ('evaluated' to a tree representation)
		var rpn_stack = [];
		
	};
};