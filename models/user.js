const {
  getDb
} = require('../util/database');
const ObjectId = require('mongodb').ObjectId;

class User {
  constructor(name, email, cart, userId) {
    this.name = name;
    this.email = email;
    this.cart = cart;
    this._id = userId;
  }

  save() {
    const db = getDb();
    return db.collection('users').find({
        name: this.name
      })
      .toArray()
      .then(result => {
        return result
      })
      .then(result => {
        if (!result.length) {
          db.collection('users').insertOne(this).then((result) => {
            return result;
          })
        }
      })
      .catch(err => {
        console.log(err);
      });
  }

  addToCart(product) {
    const db = getDb();
    const cartProductIndex = this.cart.items.findIndex(cp => {
      return cp.productId.toString() === product._id.toString();
    });
    const updatedCartItems = [...this.cart.items];
    if (cartProductIndex >= 0) {
      updatedCartItems[cartProductIndex].quantity = updatedCartItems[cartProductIndex].quantity + 1;
    } else {
      updatedCartItems.push({
        productId: ObjectId(product._id),
        quantity: 1
      });
    }

    const updatedCart = {
      items: updatedCartItems,
    }
    return db
      .collection('users')
      .updateOne({
        _id: ObjectId(this._id)
      }, {
        $set: {
          cart: updatedCart
        }
      });
  }

  getCart() {
    const db = getDb();
    const productIds = this.cart.items.map(i => {
      return i.productId;
    });

    return db
      .collection('products')
      .find({
        _id: {
          $in: productIds
        }
      })
      .toArray()
      .then(products => {
        return products.map(p => {
          return {
            ...p,
            quantity: this.cart.items.find(i => {
              return i.productId.toString() === p._id.toString()
            }).quantity
          }
        })
      })
      .catch(err => {
        console.log(err);
      })
  }

  deleteCartItem(cartProductId) {
    const db = getDb();
    const updatedCart = this.cart.items.filter(p => p.productId.toString() !== cartProductId)
    return db.collection('users')
      .updateOne({
        _id: ObjectId(this._id)
      }, {
        $set: {
          cart: {
            items: updatedCart
          }
        }
      })
      .then(result => {
        // console.log(result);
        return result;
      })
      .catch(err => {
        return err
      })
  }

  createOrder() {
    const db = getDb();
    return this.getCart().then(products => {
        const order = {
          items: products,
          user: {
            _id: ObjectId(this._id),
            name: this.name
          }
        }
        return db.collection('shopOrders').insertOne(order)
      }).then(() => {
        return db.collection('users').updateOne({
          _id: ObjectId(this._id)
        }, {
          $set: {
            cart: {
              items: []
            }
          }
        })
      })
      .then(result => {
        return result;
      })
      .catch(err => {
        console.log(err);
      });
  }

  getOrders() {
    const db = getDb();
    return db.collection('shopOrders').find({
        'user._id': ObjectId(this._id)
      })
      .toArray()
      .then((result => {
        return result;
      }))
      .catch(err => {
        console.log(err);
      });
  }

  static findById(id) {
    const db = getDb();
    return db.collection('users').findOne({
        _id: ObjectId(id)
      })
      .then(users => {
        return users;
      })
      .catch(err => {
        console.log(err);
      })
  }
}

module.exports = User;