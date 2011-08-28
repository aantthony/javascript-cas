M.latex={
	"stringify":function(){},
	"parse":function(s){
		O(1, "Latex.parse");
		// O(n * k), n=string length, k = amount of '\frac's
		//Currently only parses \frac
		var i,l=s.length
		//indexOf is BAD!!! It is fine only when we only have one type of \expr
		var debug=0;
		while(!debug && (i = s.indexOf("\\begin"))!=-1){
			debug=1;
			var n = s.indexOf("}", i+7);
			
			var type=s.substring(i+7,n);
			
			var end_string="\\end{"+type+"}";
			
			var b = s.indexOf(end_string, n);
			var x = s.substring(n+1,b);
			switch(type){
			case "matrix":
				
				x=x.replace(/\\\:/g, ",").replace(/\\\\/g, ";");
				s=s.split("");
				
				//s.splice(b,b+end_string.length);
				
				s[i]="[";
				s.splice(b, end_string.length-1);
				s[b]="]";
				s.splice(n+1,b-n-1,x);
				s.splice(i+1,n+1-i-1);
				s=s.join("");
				break;
			default:
				throw(new SyntaxError("Latex \\begin{"+type+"} block not understood."))
			}
		}
		while((i = s.indexOf("\\frac"))!=-1){
			var n,good=false;
			var deep=0;
			for(n = i+5;n<l;n++){
				if(s[n]=="{"){
					deep++;
				} else if(s[n]=="}"){	
					deep--;
					if(!deep){
						good=true;
						break;
					}
				}
			}
			if(!good){
				throw(new SyntaxError(msg.latexParse));
			}
			good=false;
			
			if(s[n+1]!="{"){
				throw(new SyntaxError("Unexpected '"+s[n+1]+"' between \\frac operands"));
			}
			
			var i2=n+1;
			var n2;
			for(n2 = i2;n2<l ;n2++){
				if(s[n2]=="{"){
					deep++;
				} else if(s[n2]=="}"){
					
					deep--;
					if(!deep){
						good=true;
						break;
					}else{
						
					}
				}
			}
			if(!good){
				throw(new SyntaxError(msg.latexParse));
			}
			console.log(s);
			s=s.split("");
			
			//TODO: bad idea. maybe fix requiresParen...
			s[i+5]="((";
			s[n]=")";
			s[i2]="(";
			s[n2]="))";
			s.splice(i2,0,"/");
			s.splice(i,5);
			s=s.join("");
			
		}
		var latexexprs = {
			"cdot":"*",
			"vee":"∨",
			"wedge":"&&",
			"neg":"¬",
			"left":"",
			"right":"",
			"pm":"±",
			"circ":"∘",
			"sqrt":"√",
			"div":"/",
			
			'gt':">",
			"left|":"abs:(",
			"right|":")",
			"cosh":"cosh",
			"sinh":"sinh",
			"tanh":"tanh",
			"coth":"coth",
			"sech":"sech",
			"csch":"csch",
			"cosech":"cosech",
			"sin":"sin",
			"cos":"cos",
			"tan":"tan",
			"times":"*",
			"sec":"sec",
			"cosec":"cosec",
			"csc":"csc",
			"cotan":"cotan",
			"cot":"cot",
			"ln":"ln",
			"lg":"log",
			"log":"log",
			"det":"det",
			"dim":"dim",
			"max":"max",
			"min":"min",
			"mod":"mod",
			"lcm":"lcm",
			"gcd":"gcd",
			"gcf":"gcf",
			"hcf":"hcf",
			"lim":"lim",
			":":"",
			"left(":"(",
			"right)":")",
			"left[":"[",
			"right]":"]",
			'ge':">=",
			'lt':"<",
			'le':"<=",
			"infty":"∞",
			"text":"",
			"frac":"",
			"backslash":"\\",
			"alpha":"α",
			"beta":"β",
			'gamma':"γ",
			'delta':"δ",
			'zeta':"ζ",
			'eta':"η",
			'theta':"θ",
			'iota':"ι",
			'kappa':"κ",
			'mu':"μ",
			'nu':"ν",
			'xi':"ξ",
			'omicron':"ο",
			'rho':"ρ",
			'sigma':"σ",
			'tau':"τ",
			'upsilon':"υ",
			'chi':"χ",
			'psi':"ψ",
			'omega':"ω",
			'phi':"ϕ",
			"phiv":"φ",
			"varphi":"φ",
			"epsilon":"ϵ",
			"epsiv":"ε",
			"varepsilon":"ε",
			"sigmaf":"ς",
			"sigmav":"ς",
			"gammad":"ϝ",
			"Gammad":"ϝ",
			"digamma":"ϝ",
			"kappav":"ϰ",
			"varkappa":"ϰ",
			"piv":"ϖ",
			"varpi":"ϖ",
			"rhov":"ϱ",
			"varrho":"ϱ",
			"thetav":"ϑ",
			"vartheta":"ϑ",
			"pi":"π",
			"lambda":"λ",
			'Gamma':"Γ",
			'Delta':"Δ",
			'Theta':"Θ",
			'Lambda':"Λ",
			'Xi':"Ξ",
			'Pi':"Π",
			'Sigma':"Σ",
			'Upsilon':"Υ",
			'Phi':"Φ",
			'Psi':"Ψ",
			'Omega':"Ω",
			"perp":"⊥",
			",":" ",
			"nabla":"∇",
			"forall":"∀",
			"sum":"∑",
			"summation":"∑",
			"prod":"∏",
			"product":"∏",
			"coprod":"∐",
			"coproduct":"∐",
			"int":"∫",
			"integral":"∫"
			
		};
		s=s.replace(/\\([a-z]+)/g,function(u,x){
			var s=latexexprs[x];
			return " "+ ((s!=undefined)?s:x);
		});
		
		
		//Naughty:
		s=s.replace(/[\[\{]/g,"(");
		s=s.replace(/[\]\}]/g,")");
		
		s=s.replace(/\\:/g," ");
		s=s.replace(/\\/g,"");
		s=s.replace(/\^/g,"**");
		return s;
	}
};