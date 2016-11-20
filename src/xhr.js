var Promise = require('promise-polyfill');
module.exports = function(url,params){
    var method = 'GET';
    if(url.substr(0,4) === 'GET ') {
        url = url.substr(4);
    } else if(url.substr(0,5) === 'POST '){
        method = 'POST';
        url = url.substr(5);
    }

    return new Promise(function(resolve,reject){
        $.ajax({
            async: true,
            crossDomain: true,
            url: url,
            type: method,
            data: params? JSON.stringify(params,null,4): undefined,
            //contentType:"application/json; charset=utf-8",
            dataType:"json"
        })
            .done(function (response, textStatus, jqXHR) {
                resolve(response);
            })
            .fail(function(jqXHR,textStatus){
                reject(textStatus);
            });
    });
};