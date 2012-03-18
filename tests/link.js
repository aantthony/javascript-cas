var window = module;
var sys = require('sys');
var exec = require('child_process').exec;
var bstr = 'bash ./tests/list.sh';
exec(bstr,
    function(error, stdout, stderr){
        var files = stdout.split(" ");
        var i,l;
        for(i=0,l=files.length;i<l;i++){
            if(/outro/.test(files[i])){
                
            }else if(/intro/.test(files[i])){
                
            }else{
                require("../"+files[i])
            }
        }
    }
);