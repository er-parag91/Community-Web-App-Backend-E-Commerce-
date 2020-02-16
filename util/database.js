const Sequelize = require('sequelize').Sequelize;

const sequelize = new Sequelize(
  'express-app',
  'root',
  'mypass123', {
    dialect: 'mysql',
    host: 'localhost'
  });

  module.exports = sequelize;
  