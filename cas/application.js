window.$$=function getElementById(i){
	return document.getElementById(i.substring(1));
};

!(function (window, undefined) {
	var html={
		"console":$$("#console")
	};
	function exec(latex){
		//Convert to javascript:
		return M(M.latex.parse(latex)).eval();
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
			if(this.current){
				window.d=d;
				var result=document.createElement("div");
				result.className="result";
				var res;
				try{
					res = exec(d);
					result.appendChild(document.createTextNode(res));
					this.current.appendChild(result);
				} catch(ex){
					res=ex;
					result.className+=" error";
					result.appendChild(document.createTextNode(res));
					this.current.appendChild(result);
					return false;
				}
			}
			var mathQuill=document.createElement("div");
			var current = this.current = this.write(mathQuill, "write user");
			setTimeout(function(){current.style.opacity=1.0;},1);
			mathQuill.appendChild(document.createTextNode(""));
			
			var self=this;
			$(mathQuill)
				.mathquill("editable")
				//.trigger({ type: "keydown", ctrlKey: true, which: 65 })
				.focus()
				.bind("keydown.jscas", function(event) {
						if(event.which == 13) {
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
				
				);
				$(current).bind("click.jscas",function() {
					$(mathQuill).focus();
				});
			return true;		
		}
	};
	console.log=console.write;
	console.execute();
})(window);