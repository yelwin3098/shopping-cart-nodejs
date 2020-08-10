var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressHbs=require('express-handlebars');
var mongoose=require('mongoose');
const Handlebars = require('handlebars');
// var bodyParser=require('body-parser');
var session=require('express-session');
var passport=require('passport');
var flash=require('connect-flash');
var validator = require('express-validator');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
var MongoStore=require('connect-mongo')(session);

var indexRouter = require('./routes/index');
var userRouter=require('./routes/user');
var adminRouter=require('./routes/admin')

var app = express();
var pjax = require('express-pjax');

const url=process.env.MONGOD_URI || "mongodb://localhost:27017/shopping";

try{
    mongoose.connect(url,{
        //useMongoClient:true
        useNewUrlParser:true,
        useUnifiedTopology: true 
    })
}catch(error){
    console.log(error)
}
app.use(pjax())
require('./config/passport');
// view engine setup
app.engine('.hbs',expressHbs({defaultLayout:'layout',handlebars: allowInsecurePrototypeAccess(Handlebars),extname:'.hbs'}));

app.set('view engine', 'hbs');

app.use(logger('dev'));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended:false}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(session({
    secret:'mysupersecret',
    resave:false,
    saveUninitialized:false,
    store:new MongoStore({mongooseConnection:mongoose.connection}),
    cookie:{maxAge:180* 60 * 1000}
  }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req,res,next){
  res.locals.login=req.isAuthenticated();
  res.locals.session=req.session;
  res.locals.success_message=req.flash('success-message');
  res.locals.error_message=req.flash('error-message');
  next();
});

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/admin',adminRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
