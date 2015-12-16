var queryparams = require('./queryparams');

function Order(opts){
    this.opts = opts;
    this.url = opts.url;
    this.products = {};
    this.issuers = {};
    this.order = JSON.parse(localStorage.getItem('order-data')) || {
        //"product":opts.product,
        //"name":"Full Name",
        //"email":"email@mail.com",
        //"address":"Street 1",
        //"zipcode":"1234AB",
        //"city":"Nijmegen",
        //"telephone":"0612345678",
        //"accept":true
    };
    this.validate = {
        "issuer":/.*/,
        "name":/([A-Za-z]{2,} ){1,}[A-Za-z]{2,}/,
        "email":/^[^@]+@[^\.]+\.[A-Za-z0-9]+$/,
        "address":/^[A-Z-a-z]{2,} +[0-9a-zA-Z-_ ]+$/,
        "zipcode":/^[0-9]{4} ?[A-Za-z]{2}$/,
        "city":/^[A-Za-z]{2,}$/,
        "quantity":/^[0-9]{1,2}$/,
        "telephone":/^(0031|\+31|0)([0-9]){9}$/,
        "accept":/^true$/,
        "comment":/.*/
    };

    this._validateField = this._validateField.bind(this);
    this._validate = this._validate.bind(this);

    var self = this;
    
    if(self.opts.product){
        this.getIssuers();
        this.getProducts();
    }

    if(queryparams.ref){
        this.getStatus();
    }

    $(function(){
        self.el = {
            'issuers': $('#issuers'),
            inputs: $('input[name],select[name]'),
            accept: $('input[name="accept"]'),
            comment: $('textarea[name="comment"]'),
            submit: $('.submit'),
            form: $('form[product]'),
            product: $('.description'),
            full: $('.full'),
            loading: $('.loading'),
            total: $('.total-amount')
        };

        if(self.el.form.length === 0) return; //abort if there is no form...

        self.order.product = self.opts.product;
        if(!self.order.product) {
            self.el.loading.html('<h3>Aanmeldformulier</h3>Geen product opgegeven.<br/><a href="/aanbod/">Terug naar het aanbod.</a>');
            return;
        }
        window.mouseflowHtmlDelay = 3000;

        self.el.inputs.change(self._validateField);
        self.el.inputs.keyup(self._validateField);
        self.el.submit.click(function(){
            if(self._validate()){
                self.pay();
            }
        });
        self.el.comment.keyup(function(){
            self.order.comment = self.el.comment.val();
        });
        self.el.issuers.change(function(){
            self.order.issuer = self.el.issuers.val();
        });

        $.each(self.order,function(name,val){
            if(name === 'product' || name === 'issuer') return;
            $el = $('[name="'+name+'"]');
            if(!$el) return;
            $el.val(val);
            self._validateField({ target: $el });
        });
    });
}

Order.prototype._exec = function Exec(method,action,data){
    var opts = {
        url: this.url.replace('[ACTION]',action),
        method: method,
        dataType: 'json'
    };
    if(method === 'POST'){
        opts.data = JSON.stringify(data);
        opts.contentType = 'application/json; charset=utf-8';
    }

    return $.ajax(opts);
};

Order.prototype.getStatus = function(){
    this._exec('GET','status/'+queryparams.ref)
        .done(function(result){
            if(result.status === 'paid' || queryparams.success === 'true'){
                $('.success').show();

                // var widget = {
                //     ref: queryparams.ref,
                //     color: 'cf4c6a',
                //     name: 'Leven in Compassie',
                //     widget_id: 'levenincompassie-xlcvDG9a9r7TtNU5qPKHRZ2fPOPREv',
                //     value: 1,
                //     done: 'hide',
                //     selector: '.widget',
                //     fullview: true,
                //     transparent: true,
                //     text: JSON.stringify({
                //         title: 'Leven in Compassie doneert {value} euro van je betaling aan een goed doel. Wat voor goeds wil je doen?'
                //     })
                // };
                // var src = '//ybdn-app.youbedo.com/widget-embed/embed.js?' + queryparams.create(widget);
                // if(ENV === 'dev') src = '//localhost:8080/widget-embed/embed.js?' + queryparams.create(widget);
                // var script = document.createElement('SCRIPT');
                // script.setAttribute('src',src);
                // document.head.appendChild(script);
            } else {
                $('.error').show();
            }
        });
};

Order.prototype._validateField = function validatField(ev){
    $el = $(ev.target);
    var name = $el.attr('name');
    var val = $el.val().trim();
    if(name === 'accept'){
        val = $el.is(':checked');
    }
    this._showValid($el,this.validate[name].test(val+''));
    this._validate();
};

Order.prototype._validate = function validateAll(){
    var valid = true;
    var self = this;
    $.each(this.validate,function(name,regex){
        $el = $('[name="'+name+'"]');
        var val = name === 'accept'? $el.is(':checked'): $el.val();
        if(!regex.test(val+'')){
            valid = false;
        } else {
            self.order[name] = val;
        }
    });
    self.order.quantity = self.order.quantity? self.order.quantity * 1.0: 1;

    localStorage.setItem('order-data',JSON.stringify(this.order));
    if(this.order.telephone){
        localStorage.setItem('number',this.order.telephone);
    }
    trackVar('name',1,this.order.name);
    trackVar('email',2,this.order.email);

    this.el.submit.attr('disabled',valid? null: true);
    if(this.product)
        this.el.total.text((this.order.quantity || 1) * (this.product.payment.amount - this.product.payment.discount));
    return valid;
};

Order.prototype._showValid = function($el,valid){
    if(valid){
        $el.parent().find('.valid').show();
        $el.parent().find('.invalid').hide();
    } else {
        $el.parent().find('.invalid').show();
        $el.parent().find('.valid').hide();
    }
};

Order.prototype.getProducts = function GetProducts(){
    var self = this;
    return this._exec('GET','products')
        .done(function(products){
            self.products = products;
            var product = self.product = products[self.order.product];
            if(!product){
                $('.error-notfound').show();
                $('.loading').hide();
                return
            }
            $('.amount').text(product.payment.amount - product.payment.discount);
            self.el.total.text((self.order.quantity || 1) * (product.payment.amount - product.payment.discount));
            $('.discount').text(product.payment.discount);
            $('.first').text(product.payment.first);
            if(product.payment.discount > 0){
                $('.discount-show').show();
            }
            $('select[name="quantity"] option').slice(product.max - product.participants).remove();
            self.el.product.text(product.payment.description);
            if(product.participants < product.max || self.opts.forcePay){
                self.el.form.show();
            } else {
                self.el.full.show();
            }
            $('.loaded-hide').hide();
            $('.loaded-show').show();

            var left = product.max - product.participants;
            if(product.participants >= product.max - product.warn && left > 0){
                $('.almost-full').show();
                $('.left').text(left);
            }
        });
};

Order.prototype.getIssuers = function GetIssuers(){
    var self = this;
    return this._exec('GET','issuers')
        .done(function(issuers){
            $.each(issuers,function(i,issuer){
                self.issuers[issuer.id] = issuer.name;
                var option = $('<option>').attr('value',issuer.id).text(issuer.name);
                self.el.issuers.append(option);
            });
        });
};

Order.prototype.pay = function Pay(){
    if(ga) ga('send', 'event', 'button', 'click', 'aanmelden');
    return this._exec('POST','pay',this.order)
        .done(function(payment){
            localStorage.setItem('order-payment',JSON.stringify(payment));
            location.href = payment.paymentUrl;
        });

};

$(function(){
    window.order = new Order({
        url:'http://www.levenincompassie.nl/api/[ACTION]?token='+API_KEY,
        forcePay: !!queryparams['force-pay'],
        product: queryparams.p || $('#aanmelden').attr('product')
    });
    if(typeof headroom !== 'undefined') headroom.unpin();
});