module.exports = function match(a, b, x) {
     if (a.compile) {
         return match(a.compile(x), b,  x);
     }
     if (b.compile) {
         return match(a, b.compile(x), x);
     }
     for(var i = -10; i < 10; i+= 3.2) {
         var A = a(i);
         var B = b(i);
         if (A !== B) {
             var fa = a.toString().replace(/\s+/g, ' ');
             var fb = b.toString().replace(/\s+/g, ' ');
             throw new Error('Function mismatch: at ' + i +'. Expected f(' + i + ') = ' + A + ' to equal ' + B + '\n\n' + fa + '\n' + fb + '\n');
         }
     }
 };

