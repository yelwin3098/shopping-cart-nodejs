var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	imagePath: {
		type: String, 
		required: true
	},

	title: {
		type: String, 
		required: true
	},

	description: {
		type: String, 
		required: true
	},

	price: {
		type: Number, 
		required: true
	}

},{ timestamps: {} });

module.exports = mongoose.model('ProductMonth', schema);