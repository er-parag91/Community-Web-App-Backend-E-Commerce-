const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

// dummy user class 
const User = require('./models/user');

// database
const { mongoConnect } = require('./util/database');

// Controllers import
const errorController = require('./controllers/error');

// Routes import
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

const app = express();

// View
app.set('view engine', 'ejs');
app.set('views', 'views');


// express logic
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));

// middleware and routes 

app.use((req, res, next) => {
  User.findById('5e4ace8b7249bf33ac0f6cba').then(user => {
    req.user = new User(user.name, user.email, user.cart, user._id);
    next();
  }).catch(err => {
    console.log(err)
  });
});
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(errorController.get404);

mongoConnect(() => {
  const user = new User('Parag', 'test@test.com');
  user
    .save()
    .then(() => {
      app.listen(3000);
    })
    .catch(err => {
      console.log(err);
    })
})
