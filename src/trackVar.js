window.trackVar = function(key,dim,val){
	if(!val) return;
	localStorage.setItem(key,val);
    ga('set', 'dimension'+dim, val);
    _mfq.push(["setVariable", key, val]);
};