M.register("Bitmap", function (M, Expression, config){
	function Bitmap (f) {
		var pts = [];
	}
	Bitmap.prototype.drawToCanvas = function (context) {
		
	};
	Expression.Function.prototype.bitmap = function () {
		return new Bitmap(this);
	};
	Expression.prototype.bitmap = function () {
		return Expression.Function().bitmap();
	};
});
