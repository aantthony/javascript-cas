window.$$=function getElementById(i){
	return document.getElementById(i.substring(1));
};
!(function (window, undefined) {
	"use strict";
	var webkit=/WebKit/.test(navigator.userAgent);
	var $overlay=$("#overlay");
	function Overlay(x,y){
		this.bind(x,y);
	}
	Overlay.prototype.show=Overlay.prototype.hide=function(){};
	Overlay.prototype.bind=function(x,y){
		if(typeof x==="string"){
			this[x]=y;
			return this;
		}
		var i;
		for(i in x){
			if(x.hasOwnProperty(i)){
				this[i]=x[i];
			}
		}
		return this;
	};
	var overlay={
		"loading":new Overlay({
			"show":function($page, message){
				var spinner=$page.find("img")[0];
				var deg=0;
				this.running=true;
				var timestep=200;
				var self=this;
				function animLoop(){
					spinner.style.webkitTransform="rotate(-"+deg+"deg)";
					//-moz-transform: rotate(-90deg);
					deg+=timestep/4;
					if(self.running){
						setTimeout(animLoop, timestep);
					}
				}
				$page.find("p").text(message);
				setTimeout(animLoop, 0);
			},
			"hide":function(){
				this.running=false;
			}
		}),
		"show": function (id, args){
			if(overlay.current){
				overlay.hide();
			}
			var $page=$overlay.find("#"+id);
			$overlay.css({"display":"block"});
			if(overlay[id]){
				overlay[id].show.apply(overlay[id],[$page].concat(args));
			}
			overlay.current=id;
		},
		"hide":function(){
			overlay[overlay.current].hide();
			overlay.current=false;
			$overlay.css({"display":"none"});
		}
	};
	
	
	
	
	//overlay.show("loading", "Connecting to Server...");
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	//pre set interface elements:
	$("#header")
		.find("input[value='+']")
			.bind("click", function(){
				window.open("/#new");
			})
		.end();
	
	
	
	
	
	
	
	
	var html={
		"console":$$("#console"),
		"main":$$("#main")
	};
	function Page(){
		this.context = new M.Context();
		this.equations = [];
	}
	Page.prototype.exec = function(){
		
	};
	Page.prototype.deleteEquation = function(id){
		this.equations[id] = undefined;
	};
	Page.prototype.writeEquation = function(eqn){
		
		return equationID;
	};
	var pages = {
		
	};
	var ctrlcodes={"clear":"[H[2J"};
	
	function exec(latex){
		//Convert to javascript:
		var expr=M(M.latex.parse(latex)).eval();
		window.pageID=pageID;
		if(!expr.impliedBy(pages[pageID].context)){
			//throw(new Error("That statement may not be true."));
			expr.className = "new";
			context.learn(expr);
		}
		if(typeof expr==="string" && ctrlcodes[expr] !== undefined){
			return ctrlcodes[expr];
		}
		
		return expr;
	}
	function delEvent(e){
		var $target=$(e.target);
		var $elem=$target.parent();
		var code = $elem.attr("id");
		code = /^page-(\d+)-eqn-(\d+)$/.exec(code).slice(1);
		var page = code[0];
		var eqn = code[1];
		$target.remove();
		$elem.hide(200);
	}
	var lastID=1;
	var pageID=0;
	var console = {
		"current":undefined,
		"write" :function(data, className, id){
			var elem = document.createElement("li");
			elem.id=id;
			elem.className=className;
			elem.tabIndex=0;
			elem.appendChild(typeof data === "string" ? document.createTextNode(data) : data);
			var del=document.createElement("div");
			$(del).bind("click.jscas", delEvent);
			del.className="del";
			elem.appendChild(del);
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
				var result=document.createElement("div");
				result.className="result";
				//try{
					d=exec(d);
					
					if(d.className){
						this.current.className+=" "+d.className;
					}
					var assumptions=M.getAssumptions();
					res=d.toExpression();
					//res = exec(d).toLatex();
					if(res==ctrlcodes.clear){
						//
						$(html.console).children().remove();
						res="";
					}else{
						
						
						result.appendChild(document.createTextNode(res));
						
						this.current.appendChild(result);
						if(assumptions.length){
							
							var ass_m = document.createElement("span");
							ass_m.appendChild(document.createTextNode(assumptions.toExpression()));
							var ass = document.createElement("span");
							ass.appendChild(document.createTextNode(", "));
							ass.appendChild(ass_m);
							this.current.appendChild(ass);
							$(ass_m).mathquill();
						}
						$(this.current).find(".error").remove();
						$(result).mathquill();
					}
				/*} catch(ex){
					res=ex;
					result.className+=" error";
					result.appendChild(document.createTextNode(res));
					this.current.appendChild(result);
					
					document.body.scrollTop = $(document.body).height()
					return false;
				}
				*/
				this.current.draggable=true;
			}
			var mathQuill=document.createElement("div");
			var id = "page-"+pageID+"-eqn-"+lastID++;
			var current = this.current = this.write(mathQuill, "write user", id);
			
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
							if(self.execute(latex)){
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
						document.body.scrollTop = $(document.body).height();
					}
				});
			$(current).bind("click.jscas",function() {
				$(mathQuill).focus();
			});
			
			document.body.scrollTop = $(document.body).height();
			return true;
		}
	};
	console.log=console.write;
	
	
	
	var jsCAS_application_data = "jsCAS_application_data";
	var c = (function(){
	
	var state={};
	
	function pull(){
		if(!state.server){
			throw("No server to pull from.");
		}
		$.get({
			url: state.server,
			success: function(){
				alert();
			}
		});
	}
	
	var c = {
		
		
		"new":function(){
			var pid=Math.random();
			pages[pid] = new Page();
			pageID = pid;
			window.pages=pages;
		},
		"load":function(l){
			l=JSON.parse(l);
			if(l.server){
				state.server=String(l.server);
				pull();
			}
			l.pages && l.pages.forEach(function (p){
				var page = {
					"title":String(p.title),
					"items":[],
					"created_at":Number(p.created_at),
					"updated_at":Number(p.updated_at),
					"public":Boolean(p.public),
					"id":Number(p.id)
				};
				p.items.forEach(function (i){
					page.items.push(String(i));
				});
				
			});
		},
		"export":function(){
			return JSON.stringify(state);
		}
		
	};
		
	return c;	
	}());
	///Boot:
	
	if(window.localStorage){
		var state;
		
		if(state=localStorage.getItem(jsCAS_application_data)){
			c.load(state);
		}else{
			c.new();
			//localStorage.setItem(jsCAS_application_data,c.export());
		}
		console.execute();
	}else{
		alert("Your browser does not support localStorage. Get Safari, Chrome, Firefox or Opera.");
	}
	if(webkit){
		window.console.group("jSCAS Booted! Examples:");
		window.console.info("M.global.x=3");
		window.console.info("M.global.f=function(x){return x*x}");
		window.console.info('M("f(x)").differentiate()');
		
		window.console.groupEnd();
	}
	
})(window);