var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    cart: {type: Object, required: true},
    address: {type: String, required: true},
    name: {type: String, required: true},
    paymentId: {type: String, required: true},
    complete_status:{type:Boolean,default:0}
},{ timestamps: {} });

module.exports = mongoose.model('monthlyOrder', schema);