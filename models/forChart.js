var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    month:{type: String, required: true},
    product_no:{type: Number, required: true},
    order_no:{type: Number, required: true},
    user_no:{type: Number, required: true},
},{ timestamps: {} });

module.exports = mongoose.model('forChart', schema);