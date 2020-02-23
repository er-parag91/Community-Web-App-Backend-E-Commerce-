const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

//User model 
const User = require('./models/user');


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
  User.findById('5e52ae87ae1849191b8b54c8')
    .then(user => {
      req.user = user;
      next()
    })
    .catch(err => {
      console.log(err);
    })
}) 
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(errorController.get404);

mongoose.connect(process.env.MONGO_DB_CONNECTION, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  })