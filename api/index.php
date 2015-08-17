<?php
require 'vendor/autoload.php';
require 'config.php';

/*
 * Initialization
 */

// Mollie for payments
$mollie = new Mollie_API_Client;

// Firebase for storage
$firebase = new \Firebase\FirebaseLib(FIREBASE_URL, FIREBASE_TOKEN);

// MailGun for e-mails;
$mailgun = new \Mailgun\Mailgun(EMAIL_KEY);


/*
 * Authentication
 */
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

/*
 * Routes
 */

/**
 * GET /products -- retrieve list of products.
 *
 *      + calculate # participants
 *      + calculate discount
 */
Flight::route('GET /products',function(){
   global $firebase;
    $products = json_decode($firebase->get(FIREBASE_PATH . "/products"),true);
    foreach($products as &$product){
        $product['participants'] = isset($product['participants'])? array_sum($product['participants']): 0;
        $first = 0;
        $product['payment']['discount'] = calculateDiscount($product,$first);
        $product['payment']['first'] = $first;
    }
    Flight::json($products);
});

/**
 * GET /issuers --- retrieve list of banks (iDeal)
 */
Flight::route('GET /issuers',function(){
    global $mollie;
    Flight::json($mollie->issuers->all(),200);
});

/**
 *  POST /pay
 *
 *      - product (firebase product name)
 *      - quantity 1
 *      - email
 *      - name
 *      - telephone
 *      - address
 *      - zipcode
 *      - city
 *      - accept
 */
Flight::route('POST /pay',function(){
    global $mollie, $firebase, $token;

    // Validate Form
    $order = Flight::validate(['product','email','name','telephone','address','zipcode','city','accept']);
    if(!isset($order['quantity'])) $order['quantity'] = 1;

    // Order ID is based on product name and e-mail.
    $id = hash_hmac("md5",$order['email'] . $order['product'],HASH_SECRET);

    // Retrieve Product from firebase
    $product = $firebase->get(FIREBASE_PATH . "/products/".$order['product']);
    if($product == "null"){
        Flight::json(['error'=>'product_not_found','data'=>$order],404);
        return;
    }
    $product = json_decode($product,true);
    $molliePaymentInfo = $product['payment'];

    // Calculate Discount
    $molliePaymentInfo['amount'] -= calculateDiscount($product,$first);
    $molliePaymentInfo['amount'] *= $order['quantity'];
    $molliePaymentInfo['description'] .= ' (' . $order['quantity'] . 'x)';

    $redirectURL =  "http://www.levenincompassie.nl/bedankt?ref=$id";

    // Create Mollie payment info
    $molliePaymentInfo = $molliePaymentInfo + [
        "method"       => Mollie_API_Object_Method::IDEAL,
        "webhookUrl"=>"http://www.levenincompassie.nl/api/webhook?token=" . Flight::request()->query['token'],
        "redirectUrl"  => $redirectURL,
        'metadata' => $order + ['id'=>$id],
        "issuer"       => $order['issuer']
    ];

    // Create payment (API call)
    $payment = $mollie->payments->create($molliePaymentInfo);

    // Store Mollie Payment data with submitted form info.
    $order['payment'] = [
        'id' => $payment->id,
        'amount' => $molliePaymentInfo['amount'],
        'description' => $molliePaymentInfo['description'],
        'status' => $payment->status,
        'email'=> false,
        'paymentUrl' => $payment->getPaymentUrl()
    ];

    // Store order in firebase
    $firebase->set(FIREBASE_PATH . "/orders/$id",$order);

    // Track number of participants
    $firebase->set(FIREBASE_PATH . "/products/{$order['product']}/participants/$id",$order['quantity']);

    // Response
    Flight::json($order['payment'],200);
});

/**
 * POST /webhook --- Mollie webhook
 */
Flight::route('POST /webhook', function () {
    global $mollie, $firebase;

    // Retrieve Status
    $payment  = $mollie->payments->get($_POST["id"]);
    // Retriever Order
    $order = $payment->metadata;
    // Retrieve Status
    $status = $payment->status;

    // Execute business logic (update firebase, send mail)
    confirmOrder($status,$payment->description,$order);

    // Log webhook call
    $firebase->push(FIREBASE_PATH . '/webhook',$payment);
});

/**
 * POST /webhook-test -- Test business logic of Mollie webhook
 */
Flight::route('POST /webhook-test',function(){
    $order = json_decode(Flight::request()->getBody());
    $id = hash_hmac("md5",$order->email,HASH_SECRET);
    $order->id = $id;
    confirmOrder('paid',$order->product . '(test)',$order);
});

Flight::route('GET /status/@ref',function($ref){
    global $mollie, $firebase;

    $id = json_decode($firebase->get(FIREBASE_PATH . "/orders/$ref/payment/id"));

    try{
        $payment  = $mollie->payments->get($id);
        Flight::json(['status'=>$payment->status],200);
    } catch(\Exception $e){
        Flight::json(['status'=>'invalid_ref','ref'=>$ref,'id'=>$id, 'error'=>$e->getMessage()],200);
    }


});

/**
 * CORS
 */
Flight::route('OPTIONS *',function(){
    Flight::json(['status'=>'ok'],200);
});

/**
 * Catch-all for 404 not found
 */
Flight::route('*', function(){
    Flight::json(['error'=>'not_found'],404);
});

/**
 * Catch errors for error response
 */
Flight::map('error',function(\Exception $e){
    Flight::json(['error'=>$e->getMessage(),'stack'=>$e->getTraceAsString()],500);
});

/**
 * Validation function - verifies $fiels exist on JSON POST data.
 */
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

/**
 * getJSON function - retrieves JSON as array
 */
Flight::map('getJson',function(){
    return json_decode(Flight::request()->getBody(),true);
});

/**
 * Calculate applied discount (based on number of participants)
 *
 * @param $product   --- Firebase Product data
 * @return int       --- discount in euros
 */
function calculateDiscount($product,&$first){
    $discount = 0;
    if(isset($product['discount']['first'])){
        if(is_array($product['participant'])) {
            $n = isset($product['participants'])? array_sum($product['participants']): 0;
        } else if(isset($product['participant'])) {
            $n = $product['participant'];
        } else {
            $n = 0;
        }
        foreach($product['discount']['first'] as $max => $value){
            if($n < $max && $discount < $value) {
                $first = $max;
                $discount = $value;
            }
        }
    }
    return $discount;
}

/**
 * Mollie Webhook - business logic
 *
 *
 * @param $status           -- payment status (open,paid,expired)
 * @param $description      -- E-mail subject (mollie payment description)
 * @param $data             -- Order data (mollie payment metadat)
 */
function confirmOrder($status,$description,$data){
    global $firebase, $mailgun;
    $id = $data->id;
    $product = $data->product;

    // Save Order Status
    $firebase->set(FIREBASE_PATH . "/orders/$id/payment/status",$status);

    if ($status == 'paid')
    {
        // Confirm Participant
        // $firebase->set(FIREBASE_PATH . "/products/$product/participants/$id",true);

        // Create e-mail using mustache and a template
        $email_sent = json_decode($firebase->get(FIREBASE_PATH . "/orders/$id/payment/email"));
        if(!$email_sent) {

            // Get content from firebase
            $content = json_decode($firebase->get(FIREBASE_PATH . "/products/$product/email"));

            // Create Mustache Engine & render order in e-mail template
            $m = new Mustache_Engine();
            $content = $m->render($content, $data);

            // Get e-mail template from disk
            $html = file_get_contents(dirname(__FILE__) . "/email-template.html");

            // Render text content in the e-mail content.
            $html = $m->render($html, array(
                'product' => $description,
                'content' => str_replace("\n","<br/>\n",$content),
            ));

            // Send e-mail
            $mailgun->sendMessage(EMAIL_DOMAIN,
                array('from' => EMAIL_FROM,
                    'to' => $data->name . '<' . $data->email . '>',
                    'bcc' => EMAIL_FROM,
                    'subject' => $description,
                    'text' => $content,
                    'html' => $html
                )
            );

            $firebase->set(FIREBASE_PATH . "/orders/$id/payment/email", true);
            $firebase->push(FIREBASE_PATH . "/queue", $data->name);
        }

    }

    // Remove participant from product
    elseif ($status != 'open')
    {
        $firebase->delete(FIREBASE_PATH . "/products/$product/participants/$id");
    }
}

Flight::start();