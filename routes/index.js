var express = require('express');
var router = express.Router();
var Product = require('../models/product');
var Cart = require('../models/cart');
var Chart = require('../models/forChart')
var Order = require('../models/order');
var monthlyOrder = require('../models/monthlyOrder');

router.all('/*', (req, res, next) => {
    req.app.locals.layout = 'clientLayout';
    next();
});
/* GET home page. */
router.get('/', function (req, res, next) {
    var successMgs = req.flash('success')[0];
    Product.find(function (err, docs) {
        var productChunks = [];
        var chunkSize = 3;
        for (var i = 0; i < docs.length; i += chunkSize) {
            productChunks.push(docs.slice(i, i + chunkSize));
        }
        res.render('shop/shop_home', { title: 'Shopping Cart', products: productChunks, successMgs: successMgs, noMessage: !successMgs });
    });
});
router.get('/view_item/:id', function (req, res, next) {
    const id = req.params.id;
    Product.findById(id)
        .then((product) => {
            res.render('shop/view_item', { title: "View Item", product: product });
        });
})
router.get('/add-to-cart/:id', function (req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    Product.findById(productId, function (err, product) {
        if (err) {
            return res.redirect('/');
        }
        cart.add(product, product.id);
        req.session.cart = cart;
        console.log(req.session.cart);
        res.redirect('/');
    })
});
router.get('/reduce/:id', function (req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    cart.reduceByOne(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});
router.get('/inc/:id', function (req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    cart.IncByOne(productId)
    req.session.cart = cart;
    res.redirect('/shopping-cart');
})
router.get('/remove/:id', function (req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    cart.removeItem(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});
router.get('/shopping-cart', function (req, res, next) {
    if (!req.session.cart) {
        return res.render('shop/shop_cart', { products: null });
    }
    var cart = new Cart(req.session.cart);
    return res.render('shop/shop_cart', { title: 'Cart', products: cart.generateArray(), totalPrice: cart.totalPrice });
});
router.get('/checkout', isLoggedIn, function (req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/shopping-cart');
    }
    var cart = new Cart(req.session.cart);
    var errMsg = req.flash('error')[0];
    return res.render('shop/check_out', { title: 'Check Out', total: cart.totalPrice, errMsg: errMsg, noError: !errMsg });
});
router.post('/checkout', isLoggedIn, function (req, res, next) {
    if (!req.session.cart) {
        return res.redirect('shopping-cart');
    }
    var cart = new Cart(req.session.cart);

    var stripe = require("stripe")(
        "sk_test_51GvxqTLIyuPwwg8bNBhnXPM7yStaqRa7PRhcYbPU62LQseEwQByNCjxxcrsBCxqLzVuloeWKXDxieCyZ0q0rWYnQ00uUTxvfRW"
    );


    stripe.charges.create({
        amount: cart.totalPrice * 100,
        currency: "usd",
        source: req.body.stripeToken, // obtained with Stripe.js
        description: "Test Charge"
    }, async function (err, charge) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/checkout');
        }
        var order = new Order({
            user: req.user,
            cart: cart,
            address: req.body.address,
            name: req.body.name,
            paymentId: charge.id
        });
        var monthly_order = new monthlyOrder({
            user: req.user,
            cart: cart,
            address: req.body.address,
            name: req.body.name,
            paymentId: charge.id
        })
        monthly_order.save();
        const morder =await monthlyOrder.find();
        const lastChart =await Chart.findOne().sort('-_id');
        const update =await Chart.findByIdAndUpdate(lastChart._id, {
            order_no: morder.length,
        });
        update.save()
        order.save(function (err, result) {
            req.flash('success', 'Successfully bought product!');
            req.session.cart = null;
            res.redirect('/');
        });
    });
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}