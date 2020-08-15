var passport=require('passport');
var User=require('../models/user');
const Chart=require('../models/forChart')
var monthlyUser=require('../models/monthlyUser');
var LocalStrategy=require('passport-local').Strategy;

passport.serializeUser(function(user,done){
    done(null,user.id);
});
passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
        done(err,user);
    });
});
passport.use('local.signup',new LocalStrategy({
    usernameField:'email',
    passwordField:'password',
    passReqToCallback:true
},function(req,email,password,done){
        req.checkBody('email', 'Invalid email').notEmpty().isEmail();
		req.checkBody('password', 'Invalid password').notEmpty().isLength({min: 4});

		var errors = req.validationErrors();

		if(errors){
			var messages = [];
			errors.forEach(function(error){
				messages.push(error.msg);
			});
			return done(null, false, req.flash('error', messages));
		}
    User.findOne({'email':email}, async function(err,user){
        if(err){
            return done(err);
        }

        if(user){
            return done(null, false, {message: 'Email is already in use.'});
        }
        var newUser=new User();
        newUser.email=email;
        newUser.name=req.body.name || 'Current User';
        newUser.role=req.body.role || 'user';
        newUser.password=newUser.encryptPassword(password);
        newUser.save(async function(err,result){
            if(err){
                return done(err);
            }
            var monthly_user=new monthlyUser();
            monthly_user.email=email
            newUser.role=req.body.role || 'user';
            monthly_user.password=monthly_user.encryptPassword(password);
            monthly_user.save()
            const muser= await monthlyUser.find();
            const lastChart=await Chart.findOne().sort('-_id');
            const update =await Chart.findByIdAndUpdate(lastChart._id,{
                user_no: muser.length - 1,
            });
            update.save()
            return done(null,newUser);
        });
    });
}));
passport.use('local.signin',new LocalStrategy({
    usernameField:'email',
    passwordField:'password',
    passReqToCallback:true
},function(req,email,password,done){
        req.checkBody('email', 'Invalid email').notEmpty().isEmail();
		req.checkBody('password', 'Invalid password').notEmpty();

		var errors = req.validationErrors();

		if(errors){
			var messages = [];
			errors.forEach(function(error){
				messages.push(error.msg);
			});
			return done(null, false, req.flash('error', messages));
		}
    User.findOne({'email':email}, function(err,user){
        if(err){
            return done(err);
        }

        if(!user){
            return done(null, false, {message: 'No user found.'});
        }
        if(!user.validPassword(password)){
            return done(null, false, {message: 'Wrong Password.'});
        }
        return done(null,user);
    });
}));

