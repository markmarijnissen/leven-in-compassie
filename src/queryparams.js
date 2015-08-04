function parse(location){
	var result = {};
	var l = extract(location);
	var key,value;
	l.split('&').forEach(function(b){	
		b = b.split('=');
		key = decodeURIComponent(b[0]);
		value = decodeURIComponent(b[1]);
		if(key && value) {
			result[key] = value;
		}
	});
	return result;
}

function create(obj){
	var result = [];
	for(var key in obj){
		result.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
	}
	return result.join('&');
}

function extract(location){
	var l = (location || '?');
	var q = l.indexOf('?');
	var h = l.indexOf('#');
	if(h < 0) h = l.length;
	l = l.substr(q + 1, l.length - (l.length - h) - q - 1);
	return l;
}

var location = typeof window !== 'undefined'? window.location.search: '?';
var queryparams = parse(location);
queryparams.parse = parse;
queryparams.create = create;
queryparams.extract = extract;

module.exports = queryparams;