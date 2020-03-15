const Product = require('../models/product');
const {
  validationResult
} = require('express-validator')
const {
  deleteFile
} = require('../util/file');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      hasError: true,
      editing: false,
      product: {
        title,
        price,
        description,
      },
      errorMessage: 'Please upload valid file type',
      validationErrors: []
    });
  }
  const imageUrl = image.path;
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      hasError: true,
      editing: false,
      product: {
        title,
        price,
        description,
      },
      errorMessage: `${errors.array()[0].param}: ${errors.array()[0].msg}`,
      validationErrors: errors.array()
    });
  };

  const product = new Product({
    title,
    price,
    description,
    imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(() => {
      return res.redirect('/');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;

  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      hasError: true,
      editing: true,
      product: {
        title,
        price,
        description,
        _id: prodId
      },
      errorMessage: `${errors.array()[0].param}: ${errors.array()[0].msg}`,
      validationErrors: errors.array()
    });
  };

  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = title;
      product.price = price;
      product.description = description;
      if (image) {
        deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save().then(result => {
        res.redirect('/admin/products');
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};

exports.getProducts = (req, res, next) => {
  Product.find({
      userId: req.user._id
    })
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findOne({
      _id: prodId,
      userId: req.user._id
    })
    .then((product) => {
      if (!product) {
        return next(new Error('Product not found!!'))
      }
      deleteFile(product.imageUrl);
      return product.remove()
    })
    .then(result => {
      res.status(200).json({ message: 'Delete Succeeded!'})
    })
    .catch(err => {
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // return next(error);
      res.status(400).json({ message: 'Delete Failed!'})
    });
};