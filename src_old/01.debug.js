function deprecated(message){
	var err = new Error(message).stack;
	if(!err){
		return console.warn('Deprecated: ' + message);
	}
    console.warn(err.replace(/^Error\: /, 'Deprecated: '));
}

var startTime = new Date();