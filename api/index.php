<?php
require 'vendor/autoload.php';
require 'config.php';

// Initialization

// Mollie for payments
$mollie = new Mollie_API_Client;

// Firebase for storage
$firebase = new \Firebase\FirebaseLib(FIREBASE_URL, FIREBASE_TOKEN);

// MailGun for e-mails;
$mailgun = new \Mailgun\Mailgun(EMAIL_KEY);


// Authentication
if(!isset(Flight::request()->query['token'])){
    Flight::json(['error'=>'not_authenticated'],401);
}
$token = Flight::request()->query['token'];
if($token === TEST_TOKEN) {
    $mollie->setApiKey(MOLLIE_TEST_KEY);
} elseif($token === LIVE_TOKEN) {
    $mollie->setApiKey(MOLLIE_LIVE_KEY);
} else {
    Flight::json(['error'=>'forbidden'],403);
}


Flight::route('GET /products',function(){
   global $firebase;
    $products = json_decode($firebase->get(FIREBASE_PATH . "/products"),true);
    foreach($products as &$product){
        $product['participants'] = count($product['participants']);
    }
    Flight::json($products);
});

Flight::route('GET /issuers',function(){
    global $mollie;
    Flight::json($mollie->issuers->all(),200);
});

Flight::route('POST /pay',function(){
    global $mollie, $firebase;

    $order = Flight::validate(['product','email','name','telephone','address','zipcode','city','accept']);
    $id = hash_hmac("md5",$order['email'],HASH_SECRET);

    $product = $firebase->get(FIREBASE_PATH . "/products/".$order['product']);
    if($product == "null"){
        Flight::json(['error'=>'product_not_found','data'=>$molliePaymentInfo],404);
        return;
    }
    $product = json_decode($product,true);
    $molliePaymentInfo = $product['payment'];

    // Calculate Discount
    if(isset($product['discount']['first'])){
        $n = count($product['participants']);
        $discount = 0;
        foreach($product['discount']['first'] as $max => $value){
            if($n < $max && $discount < $value) $discount = $value;
        }
        $molliePaymentInfo['amount'] -= $discount;
    }

    $molliePaymentInfo = $molliePaymentInfo + [
        "method"       => Mollie_API_Object_Method::IDEAL,
        "webhookUrl"=>"http://www.levenincompassie.nl/api/webhook",
        "redirectUrl"  => "http://www.levenincompassie.nl/bedankt?ref=$id",
        'metadata' => $order + ['id'=>$id],
        "issuer"       => $order->issuer
    ];

    $payment = $mollie->payments->create($molliePaymentInfo);
    $order['payment'] = [
        'id' => $id,
        'amount' => $molliePaymentInfo['amount'],
        'description' => $molliePaymentInfo['description'],
        'status' => $payment->status,
        'paymentUrl' => $payment->getPaymentUrl()
    ];

    $firebase->set(FIREBASE_PATH . "/orders/$id",$order);
    $firebase->set(FIREBASE_PATH . "/products/{$order['product']}/participants/$id",false);

    Flight::json($order['payment'],200);
});

Flight::route('POST /webhook', function () {
    global $mollie, $firebase;

    $payment  = $mollie->payments->get($_POST["id"]);
    $data = $payment->metadata;
    $status = $payment->status;
    webhook($status,$payment->description,$data);

    $firebase->push(FIREBASE_PATH . '/webhook',$payment);
});

Flight::route('*', function(){
    Flight::json(['error'=>'not_found'],404);
});

Flight::map('error',function(\Exception $e){
    Flight::json(['error'=>$e->getMessage()],500);
});

Flight::map('validate',function($fields){
    $obj = Flight::getJson();
    $valid = array_values(array_filter($fields,function($field) use ($obj){
        return !isset($obj[$field]) ||  empty($obj[$field]);
    }));
    if(count($valid) > 0){
        Flight::json(['error'=>'validation','fields'=>$valid],406);
    }
    return $obj;
});

Flight::map('getJson',function(){
    return json_decode(Flight::request()->getBody(),true);
});

Flight::map('uuid',function(){
    return sprintf( '%04x%04x%04x',
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
    );
});

Flight::route('POST /webhook-test',function(){
    $order = json_decode(Flight::request()->getBody());
    $id = hash_hmac("md5",$order->email,HASH_SECRET);
    $order->id = $id;
    webhook('paid',$order->product,$order);
});

function webhook($status,$description,$data){
    global $firebase, $mailgun;
    $id = $data->id;
    $product = $data->product;

    // Save Order Status
    $firebase->set(FIREBASE_PATH . "/orders/$id/payment/status",$status);

    if ($status == 'paid')
    {
        // Confirm Participant
        $firebase->set(FIREBASE_PATH . "/products/$product/participants/$id",true);

        // Create e-mail using mustache and a template
        $content = json_decode($firebase->get(FIREBASE_PATH . "/products/$product/email"));
        $m = new Mustache_Engine();
        $content = $m->render($content,$data);
        $html = file_get_contents(dirname(__FILE__) . "/email-template.html");
        $html = $m->render($html,[
            'product'=>$product,
            'content'=>str_replace("\n","<br/>\n",$content)
        ]);

        // Send e-mail
        $mailgun->sendMessage(EMAIL_DOMAIN,
            array(  'from'    => EMAIL_FROM,
                'to'      => $data->name . '<' . $data->email . '>',
                'bcc'     => EMAIL_FROM,
                'subject' => $description,
                'text'    => $content,
                'html'    => $html
            )
        );


    }
    elseif ($status != 'open')
    {
        $firebase->delete(FIREBASE_PATH . "/products/$product/participants/$id");
    }
}

Flight::start();