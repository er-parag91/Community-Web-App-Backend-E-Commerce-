const crypto = require('crypto');

//User model 
const User = require('../models/user');

// hash algorithm
const bcrypt = require('bcryptjs');

const {
  sendWelcomeEmail,
  sendPasswordReset
} = require('./email');
exports.getLogin = (req, res, next) => {
  res.render('Auth/Login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: req.flash('error')[0],
    oldInput: {
      email: '',
      password: ''
    }
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
        return res.status(422).render('Auth/Login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: req.flash('error')[0],
          oldInput: {
            email,
            password
          }
        });
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
          res.status(422).render('Auth/Login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: req.flash('error')[0],
            oldInput: {
              email,
              password
            }
          })
        })
    })
    .catch(err => {
      req.flash('error', 'Something went wrong!!');
      res.status(400).render('Auth/Login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: req.flash('error')[0],
        oldInput: {
          email,
          password
        }
      })
    });
};

exports.getSignup = (req, res, next) => {
  res.render('Auth/Signup', {
    path: '/Signup',
    pageTitle: 'Sign Up!',
    errorMessage: req.flash('error')[0],
    oldInput: {
      email: '',
      password: '',
      confirmPassword: '',
    }
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
      sendWelcomeEmail(email)
      res.redirect('/login');
    })
    .catch(err => {
      console.log(err)
      if (err.code === 11000) {
        req.flash('error', 'Email already exists!!');
      } else {
        req.flash('error', 'Invalid input data!!');
      }
      res.status(422).render('Auth/Signup', {
        path: '/Signup',
        pageTitle: 'Sign Up!',
        errorMessage: req.flash('error')[0],
        oldInput: {
          email,
          password,
          confirmPassword,
        }
      });
    })
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/')
  })
};

exports.getReset = (req, res, next) => {
  res.render('Auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: req.flash('error')[0]
  });
}

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({
        email: req.body.email
      })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account found with that email!')
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetExpiration = Date.now() + 3600000;
        return user.save()
      })
      .then(result => {
        res.redirect('/');
        sendPasswordReset(req.body.email, `http://localhost:3000/reset/${token}`)
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  })
}

exports.getPasswordReset = (req, res, next) => {
  res.render('Auth/new-password', {
    path: '/reset/token',
    pageTitle: 'New Password',
    token: req.params.token,
    errorMessage: req.flash('error')[0]
  });
}

exports.resetPassword = (req, res, next) => {
  if (req.body.password !== req.body.confirmPassword) {
    req.flash('error', 'Passwords do not match')
    return res.redirect(`/reset/${req.body.token}`);
  }
  User.findOne({
      resetToken: req.body.token,
      resetExpiration: {
        $gt: Date.now()
      }
    })
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid token. Please try or reset password again')
        return res.redirect(`/reset/${req.body.token}`);
      }
      bcrypt.hash(req.body.password, 12)
        .then(hashedPassword => {
          user.password = hashedPassword;
          user.resetToken = undefined;
          user.resetExpiration = undefined;
          return user.save()
        })
    })
    .then(result => {
      req.flash('error', 'Password is now reset successfully')
      return res.redirect('/login');
    })
    .catch(err => {
      req.flash('error', 'Invalid token. Please try or reset password again')
      return res.redirect(`/reset/${req.body.token}`);
    })
}