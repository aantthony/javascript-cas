window.$$=function getElementById(i){
	return document.getElementById(i.substring(1));
};
!(function (window, undefined) {
	var html={
		"console":$$("#console"),
		"main":$$("#main")
	};
	var context=new M.Context();//State
	
	var ctrlcodes={"clear":"[H[2J"};
	
	function exec(latex){
		//Convert to javascript:
		var expr=M(M.latex.parse(latex)).eval();
		if(!expr.impliedBy(context)){
			throw(new Error("That statement may not be true."));
		}
		if(ctrlcodes[expr] !== undefined){
			return ctrlcodes[expr];
		}
		
		return expr;
	}
	var console = {
		"current":undefined,
		"write" :function(data, className){
			var elem = document.createElement("li");
			elem.className=className;
			elem.appendChild(typeof data === "string" ? document.createTextNode(data) : data);
			html.console.appendChild(elem);
			return elem;
		},
		"warn" :function(data){
			return this.warn(data, "warn");
		},
		"error" :function(data){
			return this.warn(data, "error");
		},
		"response" :function(data){
			return this.warn(data, "response");
		},
		"execute":function(d){
			var res;
			if(this.current){
				window.d=d;
				var result=document.createElement("div");
				result.className="result";
				try{
					res = exec(d).toLatex();
					if(res==ctrlcodes.clear){
						//
						$(html.console).children().remove();
						res="";
					}else{
						
						
						result.appendChild(document.createTextNode(res));
						this.current.appendChild(result);
						$(this.current).find(".error").remove();
						$(result).mathquill();
					}
				} catch(ex){
					res=ex;
					result.className+=" error";
					result.appendChild(document.createTextNode(res));
					this.current.appendChild(result);
					
					html.main.scrollTop=$(html.console).height();
					return false;
				}
			}
			var mathQuill=document.createElement("div");
			var current = this.current = this.write(mathQuill, "write user");
			setTimeout(function(){current.style.opacity=1.0;},1);
			mathQuill.appendChild(document.createTextNode(res||""));
			
			var self=this;
			$(mathQuill)
				.mathquill("editable")
				.trigger({ type: "keydown", ctrlKey: true, which: 65 })
				.focus()
				.bind("keydown.jscas", function(event) {
						if(event.which === 13) {
							var jQueryDataKey = '[[mathquill internal data]]';
							var latex = $(this).mathquill("latex");
							if(x=self.execute(latex)){
								$(this)
									.unbind('.mathquill')
									.unbind('.jscas')
								 	.removeClass('mathquill-editable mathquill-textbox')
									.find("textarea")
										.remove()
									.end()
									.mathquill("latex");
								
								$(current).unbind(".jscas");
							}
						}
					}
				
				)
				.bind("keyup.jscas", function(event){
					//The equation may have increased in size vertically, so scroll down.
					if(event.which === 191 || event.shiftKey && event.which === 54){
						html.main.scrollTop=$(html.console).height();
					}
				});
			$(current).bind("click.jscas",function() {
				$(mathQuill).focus();
			});
			
			html.main.scrollTop=$(html.console).height();
			return true;
		}
	};
	console.log=console.write;
	console.execute();
})(window);