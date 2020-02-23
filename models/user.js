const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  cart: {
    items: [{
      productId: {
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
    return cp.productId.toString() === product._id.toString();
  });
  const updatedCartItems = [...this.cart.items];
  if (cartProductIndex >= 0) {
    updatedCartItems[cartProductIndex].quantity = updatedCartItems[cartProductIndex].quantity + 1;
  } else {
    updatedCartItems.push({
      productId: product._id,
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
    const updatedCart = this.cart.items.filter(item => item.productId.toString() !== cartProductId);
    this.cart.items = updatedCart;
    return this.save()
}

module.exports = mongoose.model('User', userSchema);

//   createOrder() {
//     const db = getDb();
//     return this.getCart().then(products => {
//         const order = {
//           items: products,
//           user: {
//             _id: ObjectId(this._id),
//             name: this.name
//           }
//         }
//         return db.collection('shopOrders').insertOne(order)
//       }).then(() => {
//         return db.collection('users').updateOne({
//           _id: ObjectId(this._id)
//         }, {
//           $set: {
//             cart: {
//               items: []
//             }
//           }
//         })
//       })
//       .then(result => {
//         return result;
//       })
//       .catch(err => {
//         console.log(err);
//       });
//   }

//   getOrders() {
//     const db = getDb();
//     return db.collection('shopOrders').find({
//         'user._id': ObjectId(this._id)
//       })
//       .toArray()
//       .then((result => {
//         return result;
//       }))
//       .catch(err => {
//         console.log(err);
//       });
//   }

//   static findById(id) {
//     const db = getDb();
//     return db.collection('users').findOne({
//         _id: ObjectId(id)
//       })
//       .then(users => {
//         return users;
//       })
//       .catch(err => {
//         console.log(err);
//       })
//   }
// }

// module.exports = User;