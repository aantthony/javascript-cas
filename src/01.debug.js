function deprecated(message){
    console.warn(new Error(message).stack.replace(/^Error\: /, "Deprecated: "));
}
