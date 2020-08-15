var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt=require('bcrypt-nodejs');

const roles = [
    'user', 'admin','manager','customer'
  ]

var userSchema=new Schema({
    name:{
        type:String,
        default:"Current User"
    },
    image:{
        type:String,
        default:"uploads/default.png"
    },
    email:{type: String, required: true},
    password:{type: String, required: true},
    role: {
        type: String,
        default: 'user',
        enum: roles
      }
},{ timestamps: {} });

userSchema.methods.encryptPassword=function(password){
    return bcrypt.hashSync(password,bcrypt.genSaltSync(5),null);
};
userSchema.methods.validPassword=function(password){
    return bcrypt.compareSync(password,this.password);
};

module.exports=mongoose.model('User',userSchema);