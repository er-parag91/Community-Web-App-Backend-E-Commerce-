const mongoose = require('mongoose');
const User = require('./user');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
});


productSchema.pre('deleteOne', function (next, req) {
  User.update({}, {
      $pull: {
        'cart.items': {
          product: this._conditions._id
        }
      }
    }, {
      multi: true
    })
    .then((result) => {
      next();
    })
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;