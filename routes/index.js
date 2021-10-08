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
router.get('/', async function (req, res, next) {
    var successMgs = req.flash('success')[0];
    const user_id=req.user ? req.user.id:'';
    const products=await Product.find()
        const check_like=[]
        products.forEach(p => {
            const ck_like=p.likes.includes(user_id)
            check_like.push(ck_like)
        });
        console.log(check_like)
        res.render('shop/shop_home',{ title: 'Shopping Cart',ck_like:check_like, products: products, successMgs: successMgs, noMessage: !successMgs });
});

router.get('/like/:id',function (req, res, next) {
    const id = req.params.id;
    const user_id=req.user.id;
    Product.findByIdAndUpdate(id, { $push: { likes: user_id } }, { new: true })
        .then((product) => {
            res.redirect('/view_item/'+id)
        });
})
router.get('/unlike/:id',function (req, res, next) {
    const id = req.params.id;
    const user_id=req.user.id;
    Product.findByIdAndUpdate(id, { $pull: { likes: user_id } }, { new: true })
        .then((product) => {
            res.redirect('/view_item/'+id)
        });
})
router.get('/view_item/:id', function (req, res, next) {
    const id = req.params.id;
    const user_id=req.user ? req.user.id:'';
    Product.findById(id)
        .then((product) => {
            const ck_like=product.likes.includes(user_id)
            res.render('shop/view_item', { title: "View Item",ck_like:ck_like, product: product });
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