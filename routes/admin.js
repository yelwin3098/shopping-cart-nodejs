var express = require('express');
var router = express.Router();
const multer = require('multer');
var passport = require('passport');
const Product = require('../models/product');
const Order=require('../models/order');
const User=require('../models/user');
const fs=require('fs')


router.get('/', (req, res, next) => {
    req.app.locals.layout = 'adminLogin';
    var messages = req.flash('error');
    res.render('admin/login', {
        messages: messages,
        hasErrors: messages.length > 0
    })
});

router.post('/', passport.authenticate('local.signin', {
    failureRedirect: '/admin',
    failureFlash: true
}), function (req, res, next) {
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    } else {
        res.redirect('/admin/dashboard');
    }
})

router.all('/*',isLoggedIn, (req, res, next) => {
    req.app.locals.layout = 'adminLayout';
    next();
});
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname)
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

router.get('/dashboard', (req, res) => {
    res.renderPjax('admin/dashboard')
})

router.get('/products', async (req, res) => {

    const products = await Product.find({});
    res.renderPjax('admin/products/product_list', {title:"Admin | Products List", products: products })
});

router.get('/product_create', (req, res) => {
    res.renderPjax('admin/products/create',{title:"Admin | Product Creation Form"})
});

router.post('/product_create', upload.single('product_img'), async (req, res, next) => {
    const files = req.file
    if (!files) {
        const error = new Error('Please choose files');
        return next(error)
    }
    const product = new Product({
        title: req.body.title,
        description: req.body.description,
        imagePath: 'uploads/' + req.file.filename,
        price: req.body.price,
    });
    const saveProduct = await product.save();
    if (!saveProduct) {
        console.log('Product Fail');
        res.redirect('/admin/product_create');
    }
    req.flash('success-message', 'Product created successfully');
    res.redirect('/admin/products');
})

router.get('/product/edit/:id', async (req, res) => {
    const id = req.params.id;
    Product.findById(id)
        .then((product) => {
            res.render('admin/products/edit', {title:"Admin | Product Update Form", product: product });
        });
});
router.post('/product/edit/:id',upload.single('product_img'), async (req, res) => {

    if (req.body.file) {
        const id=req.params.id;
        const update = Product.findByIdAndUpdate(id, {
            title: req.body.title,
            description: req.body.description,
            imagePath: 'uploads/' + req.file.filename,
            price: req.body.price,
        });
        update.exec(function (err, result) {
            if (err) throw err;
            req.flash('success-message', 'Product Update successfully');
            res.redirect('/admin/products')
        })
    }else{
        const id=req.params.id;
        const update = Product.findByIdAndUpdate(id, {
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
        });
        update.exec(function (err, result) {
            if (err) throw err;
            req.flash('success-message', 'Product Update successfully');
            res.redirect('/admin/products')
        })
    }
});

router.get('/product/delete/:id',async(req, res) => {
    const id = req.params.id;
    const product = await Product.findById(id);
    if (!product) {
        req.flash('error-message', 'Products Not Exit');
        res.redirect('/admin/products')
    } else {
        await product.remove((err, result) => {
            if (err) {
                req.flash('error-message', 'Product delete fail');
                res.redirect('/admin/products')
            } else {
                fs.unlink('public/'+product.imagePath, (err, done) => {
                    if (err) {
                        req.flash('error-message', 'Image unlink error');
                        res.redirect('/admin/products')
                    }
                });
                
                req.flash('success-message', 'Product Deleted');
                res.redirect('/admin/products');
            }
        })
    }
});

router.get('/orders',async(req,res)=>{
    const orders = await Order.find({}).populate('user');
    res.renderPjax('admin/orders', { title:"Admin |Customer Orders List",orders: orders })
})
router.get('/order/delete/:id',async(req,res)=>{
    const id = req.params.id;
    const order = await Order.findById(id);
    if (!order) {
        req.flash('error-message', 'Order Not Exit');
        res.redirect('/admin/orders')
    } else {
        await order.remove((err, result) => {
            if (err) {
                req.flash('error-message', 'Order delete fail');
                res.redirect('/admin/orders')
            } else {                
                req.flash('success-message', 'Order Deleted');
                res.redirect('/admin/orders');
            }
        })
    }
})
router.get('/order_ship/:id',async(req,res)=>{
    const id = req.params.id;
    const update = Order.findByIdAndUpdate(id, {
        complete_status:true
    });
    update.exec(function (err, result) {
        if (err) throw err;
        // req.flash('success-message', 'Place Update successfully');
        res.redirect('/admin/orders')
    })
});
router.get('/customers',async(req,res)=>{
    const customers= await User.find({role:'user'});
    res.renderPjax('admin/customer_list', { title:"Admin |Customer List",customers: customers })
})
router.get('/logout',isLoggedIn,(req,res,next)=>{
    req.logout();
    res.redirect('/admin');
})

module.exports = router;


function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.role === 'admin') {
            return next();
        } else if (req.user.role === 'customer') {
            res.redirect('/');
        }
    }
    res.redirect('/');
}

