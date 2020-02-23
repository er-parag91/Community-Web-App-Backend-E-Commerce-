const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Product = mongoose.model('Product', new Schema({
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
}));

module.exports = Product;

// const { getDb } = require('../util/database');
// const ObjectId = require('mongodb').ObjectId;

// class Product {
//   constructor(title, price, description, imageUrl, id, userId) {
//     this.title = title;
//     this.price = price;
//     this.description = description;
//     this.imageUrl = imageUrl;
//     this._id = id ? ObjectId(id) : null;
//     this.userId = userId;
//   }

//   save() {
//     const db = getDb();
//     console.log(this, 'save')

//     let dbOp;
//     if (this._id) {
//       dbOp = db.collection('products').updateOne({ _id: this._id }, { $set: this })
//     } else {
//       dbOp = db.collection('products').insertOne(this)
//     }
//       return dbOp.then(result => {
//         console.log(result);
//       })
//       .catch(err => {
//         console.log(err);
//       })
//   }

//   static getProducts() {
//     const db = getDb();
//     return db.collection('products')
//       .find()
//       .toArray()
//       .then(result => {
//         return result;
//       })
//       .catch(err => {
//         console.log(err);
//       })
//   }

//   static findByPk(prodId) {
//     const db = getDb();
//     return db.collection('products')
//       .find({ _id: ObjectId(prodId) })
//       .toArray()
//       .then(product => {
//         return product;
//       })
//       .catch(err => {
//         console.log(err);
//       })
//   }

//   static destroy(prodId) {
//     const db = getDb();
//     return db.collection('products')
//       .remove({ _id: ObjectId(prodId) })
//       .then(product => {
//         console.log(product, 'removed Product');
//         return product;
//       })
//       .catch(err => {
//         console.log(err);
//       })
//   }
// }

// module.exports = Product;