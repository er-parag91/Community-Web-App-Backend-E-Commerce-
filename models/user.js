const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  resetToken: String,
  resetExpiration: Date,
  cart: {
    items: [{
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      }
    }]
  }
})

userSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    return cp.product.toString() === product._id.toString();
  });
  const updatedCartItems = [...this.cart.items];
  if (cartProductIndex >= 0) {
    updatedCartItems[cartProductIndex].quantity = updatedCartItems[cartProductIndex].quantity + 1;
  } else {
    updatedCartItems.push({
      product: product._id,
      quantity: 1
    });
  }

  const updatedCart = {
    items: updatedCartItems,
  }
  this.cart = updatedCart;
  return this.save()
}

userSchema.methods.deleteCartItem = function(cartProductId) {
    const updatedCart = this.cart.items.filter(item => item.product.toString() !== cartProductId);
    this.cart.items = updatedCart;
    return this.save()
}

userSchema.methods.clearCart = function() {
  this.cart = { items: [] };
  return this.save();
}

module.exports = mongoose.model('User', userSchema);