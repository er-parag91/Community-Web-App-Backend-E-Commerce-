const Product = require('../models/product');
const Order = require('../models/order');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const ITEMS_PER_PAGE = 1;
const stripe = require('stripe')(process.env.STRIPE_KEY);

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product
    .find()
    .estimatedDocumentCount()
    .then(numberOfProducts => {
      totalItems = numberOfProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        previousPage: page - 1,
        nextPage: page + 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;
  Product
    .find()
    .estimatedDocumentCount()
    .then(numberOfProducts => {
      totalItems = numberOfProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        previousPage: page - 1,
        nextPage: page + 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.product')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      let cartTotal = 0;
      products.forEach((item) => {
        cartTotal += Number((item.quantity * item.product.price).toFixed(2));
      })
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        cartTotal,
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 400;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId).then(product => {
      return req.user.addToCart(product)
    })
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.deleteCartItem(prodId)
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({
      'user.userId': req.user._id
    })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then(order => {
      if (!order) {
        return next(new Error('No order Found'));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('Unauthorized'));
      }
      const invoicePath = path.join('Invoices', `invoice-${orderId}.pdf`);

      // reading whole file at once
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     console.log(err);
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', `attatchment; filename=invoice-${orderId}.pdf`);
      //   res.send(data);
      // })

      // reading file in streams
      // const file = fs.createReadStream(invoicePath);
      // res.setHeader('Content-Type', 'application/pdf');
      // res.setHeader('Content-Disposition', `attatchment; filename=invoice-${orderId}.pdf`);
      // file.pipe(res);

      // generate pdf file and stream it
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(invoicePath));
      doc
        .fontSize(22)
        .fillColor('#999')
        .text('INVOICE', {
          align: 'left',
          height: 100
        })
        .fillColor('#000000')
        .fontSize(10)
        .text(`Order Number: ${order._id}`, {
          underline: true
        })
        .moveDown(2);

      order.products.forEach(product => {
        doc
          .fontSize(12)
          .text(`${product.product.title} --- (${product.quantity} * ${product.product.price}) = $${(product.quantity * product.product.price).toFixed(2)}`)
      })
      doc.text('-----------------------------------------------------------------------------')
      doc
        .fontSize(16)
        .text(`Invoice Total: $${order.total}`)
      doc.end();
      doc.pipe(res);
    })
    .catch(err => {
      next(err);
    })
};

exports.getCheckout = (req, res, next) => {
  let products;
  let orderTotal = 0;
  req.user
    .populate('cart.items.product')
    .execPopulate()
    .then(user => {
      products = user.cart.items;
      products.forEach((item) => {
        orderTotal += Number((item.quantity * item.product.price).toFixed(2));
      })
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map(p => {
          return {
            name: p.product.title,
            description: p.product.description,
            amount: p.product.price * 100,
            currency: 'usd',
            quantity: p.quantity,
          }
        }),
        success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
        cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
      })
    })
    .then(session => {
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        orderTotal,
        sessionId: session.id
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 400;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.product')
    .execPopulate()
    .then(user => {
      let orderTotal = 0;
      const products = user.cart.items.map(item => {
        orderTotal += Number((item.quantity * item.product.price).toFixed(2));
        return {
          quantity: item.quantity,
          product: {
            ...item.product._doc
          }
        }
      });
      if (products.length) {
        const order = new Order({
          products: products,
          user: {
            email: req.user.email,
            userId: req.user
          },
          total: Number(orderTotal.toFixed(2)),
        });
        return order.save()
      }
    })
    .then((result) => {
      return req.user.clearCart()
    })
    .then(result => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}