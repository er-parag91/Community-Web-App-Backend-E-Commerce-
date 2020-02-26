//User model 
const User = require('../models/user');

// hash algorithm
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res, next) => {
  res.render('Auth/Login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: req.flash('error')[0]
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({
      email: email
    }).then((user) => {
      if (!user) {
        req.flash('error', 'Invalid email or password!');
        return res.redirect('/login');
      }

      bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              res.redirect('/')
            });
          }
          req.flash('error', 'Invalid email or password!');
          res.redirect('/login')
        })
    })
    .catch(err => {
      req.flash('error', 'Something went wrong!!');
      res.redirect('/login')
    });
};

exports.getSignup = (req, res, next) => {
  res.render('Auth/Signup', {
    path: '/Signup',
    pageTitle: 'Sign Up!',
    errorMessage: req.flash('error')[0]
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  return bcrypt.hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email,
        password: hashedPassword,
        cart: {
          items: []
        }
      })
      return user.save()
    })
    .then((result) => {
      res.redirect('/login');
    })
    .catch(err => {
      if (err.code === 11000) {
        req.flash('error', 'Email already exists!!');
      } else {
        req.flash('error', 'Invalid input data!!');
      }
      res.redirect('/signup');
    })
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/')
  })
};