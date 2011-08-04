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
				var res = exec(d);
				result.appendChild(document.createTextNode(res));
				this.current.appendChild(result);
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
							var latex = 
							$(this)
								.unbind('.mathquill')
								.unbind('.jscas')
							 	.removeClass('mathquill-editable mathquill-textbox')
								.find("textarea")
									.remove()
								.end()
								.mathquill("latex");
							$(current).unbind(".jscas");
							self.execute(latex);
						}
					}
				
				);
				$(current).bind("click.jscas",function() {
					$(mathQuill).focus();
				});
						
		}
	};
	console.log=console.write;
	html.console.innerHTML="";
	console.execute();
})(window);