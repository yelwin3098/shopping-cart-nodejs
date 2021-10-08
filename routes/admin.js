var express = require('express');
var router = express.Router();
const multer = require('multer');
var passport = require('passport');
const Product = require('../models/product');
const MonthlyProduct=require('../models/productmonth');
const MonthlyOrder=require('../models/monthlyOrder');
const MonthlyUser=require('../models/monthlyUser');
const Order=require('../models/order');
const User=require('../models/user');
const Chart=require('../models/forChart')
const fs=require('fs')
const mongoose=require('mongoose')


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

router.get('/dashboard', async(req, res) => {
    const products=await Product.find();
    const users=await User.find({role:'user'});
    const orders=await Order.find();
    const mproducts=await MonthlyProduct.find();
    const morders=await MonthlyOrder.find();
    const musers=await MonthlyUser.find({role:'user'});
    const charts=await Chart.find();
    res.renderPjax('admin/dashboard', {
        title:"Admin | Dashboard",products:products,
        users:users,orders:orders,charts:charts,
        mproducts:mproducts,morders:morders,musers:musers
        })
})

router.get('/user_creation',async(req, res) => {
    const users=await User.find();
    res.renderPjax('admin/user_creation', {
        title:"Admin | User Management",
        users:users
        })
})

router.post('/user_creation',passport.authenticate('local.signup',{
	failureRedirect: '/admin/user_creation',
	failureFlash: true
}), function (req, res, next) {
    if(req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    } else {
        res.redirect('/user/user_creation');
    }
})

router.get('/favourite',async (req, res) => {

    const products = await Product.find({}).populate('likes');
    // console.log(products)
    res.renderPjax('admin/fav_list', {title:"Admin | Favourite List", products: products })
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
    const mproduct=new MonthlyProduct({
        title: req.body.title,
        description: req.body.description,
        imagePath: 'uploads/' + req.file.filename,
        price: req.body.price,
    })
    
    const saveProduct = await product.save();
    const saveMproduct=await mproduct.save();
    const mchartproduct =await MonthlyProduct.find();
        const lastChart =await Chart.findOne().sort('-_id');
        const update =await Chart.findByIdAndUpdate(lastChart._id, {
            product_no: mchartproduct.length,
        });
        update.save()
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
router.get('/m_product/delete/:id',async(req, res) => {
    const id = req.params.id;
    const product = await MonthlyProduct.findById(id);
    if (!product) {
        req.flash('error-message', 'Products Not Exit');
        res.redirect('/admin/mproducts')
    } else {
        await product.remove((err, result) => {
            if (err) {
                req.flash('error-message', 'Product delete fail');
                res.redirect('/admin/mproducts')
            } else {
                fs.unlink('public/'+product.imagePath, (err, done) => {
                    if (err) {
                        req.flash('error-message', 'Image unlink error');
                        res.redirect('/admin/mproducts')
                    }
                });
                req.flash('success-message', 'Product Deleted');
                res.redirect('/admin/mproducts');
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
router.get('/m_order/delete/:id',async(req,res)=>{
    const id = req.params.id;
    const order = await MonthlyOrder.findById(id);
    if (!order) {
        req.flash('error-message', 'Order Not Exit');
        res.redirect('/admin/morders')
    } else {
        await order.remove((err, result) => {
            if (err) {
                req.flash('error-message', 'Order delete fail');
                res.redirect('/admin/morders')
            } else {               
                req.flash('success-message', 'Order Deleted');
                res.redirect('/admin/morders');
            }
        })
    }
})
router.get('/order_ship/:id',async(req,res)=>{
    const id = req.params.id;
    const update = Order.findByIdAndUpdate(id, {
        complete_status:true
    });
    const updateM = MonthlyOrder.findByIdAndUpdate(id, {
        complete_status:true
    });
    updateM.exec()
    update.exec(function (err, result) {
        if (err) throw err;
        res.redirect('/admin/morders')
    })
});
router.get('/customers',async(req,res)=>{
    const customers= await User.find({role:'user'});
    res.renderPjax('admin/customer_list', { title:"Admin |Customer List",customers: customers })
})

router.get('/mproducts',async(req,res)=>{
    const mproducts= await MonthlyProduct.find();
    res.renderPjax('admin/mproduct_list', { title:"Admin |Monthly Product List",mproducts: mproducts })
})
router.get('/musers',async(req,res)=>{
    const musers= await MonthlyUser.find({role:'user'});
    res.renderPjax('admin/mcustomer_list', { title:"Admin |Monthly Customer List",musers: musers })
})
router.get('/morders',async(req,res)=>{
    const morders= await MonthlyOrder.find();
    res.renderPjax('admin/morder_list', { title:"Admin |Monthly Order List",morders: morders })
})

router.get('/order/delete_all',async(req,res)=>{
    const morders=await MonthlyOrder.find()
    morders.map(async function(mo){
        const morder=await MonthlyOrder.findById(mo._id)
        morder.remove();
    })
    req.flash('success-message', ' Delete Monthly Orders successfully');
    res.redirect('/admin/morders')
})
router.get('/product/delete_all',async(req,res)=>{
    const mproducts=await MonthlyProduct.find()
    mproducts.map(async function(mp){
        const mproduct=await MonthlyProduct.findById(mp._id)
        mproduct.remove();
    })
    req.flash('success-message', ' Delete Monthly Orders successfully');
    res.redirect('/admin/mproducts',{mproductCount:mproductCount})
})
router.get('/user/delete_all',async(req,res)=>{
    const musers=await MonthlyUser.find()
    musers.map(async function(mu){
        const muser=await MonthlyUser.findById(mu._id)
        muser.remove();
    })
    req.flash('success-message', ' Delete Monthly Orders successfully');
    res.redirect('/admin/musers')
})
router.post('/chart', async (req, res, next) => {
    const mproduct=await MonthlyProduct.find();
    const morder=await MonthlyOrder.find();
    const muser=await MonthlyUser.find();
    const chart = new Chart({
        month: req.body.month,
        product_no: mproduct.length || 10,
        order_no: morder.length || 20,
        user_no: muser.length || 7,
    });
    const saveChart=await chart.save();
    if (!saveChart) {
        res.status(500).json({
            status:false,
            error:'Chart Not Save'
        })
    }
    req.flash('success-message', 'Monthly Chart successfully');
    res.redirect('/admin/chart')
})

router.get('/chart/delete/:id',async(req,res)=>{
    const id = req.params.id;
    const chart = await Chart.findById(id);
    if (!chart) {
        req.flash('error-message', 'Chart Not Exit');
        res.redirect('/admin/chart')
    } else {
        await chart.remove((err, result) => {
            if (err) {
                req.flash('error-message', 'Chart delete fail');
                res.redirect('/admin/chart')
            } else {                
                req.flash('success-message', 'Chart Deleted');
                res.redirect('/admin/chart');
            }
        })
    }
})

router.get('/chart',async (req, res, next) => {
    // Chart.findOne().sort('-_id').exec(function(err, post) {
    //     console.log(post)
    // });
    await Chart.find().sort('-_id').exec((err,charts)=>{
        res.render('admin/chart_data',{title:'Admin | Chart Data', charts:charts})
    });
})
router.get('/chart/update',async(req,res)=>{
    const mproduct=await MonthlyProduct.find();
    const morder=await MonthlyOrder.find();
    const muser=await MonthlyUser.find();
    const lastChart=await Chart.findOne().sort('-_id');
    const update =await Chart.findByIdAndUpdate(lastChart._id,{
        product_no: mproduct.length,
        order_no: morder.length,
        user_no: muser.length - 1
    });
    update.save()
    res.redirect('/admin/chart')
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

