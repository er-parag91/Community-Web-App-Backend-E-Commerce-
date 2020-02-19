const MongoClient = require('mongodb').MongoClient;

let _db;
const mongoConnect = callback => {
  MongoClient.connect(process.env.MONGO_DB_CONNECTION, { useUnifiedTopology: true }).then(client => {
    console.log('connected');
    _db = client.db();
    callback();
  }).catch(err => {
    console.log(err);
    throw err;
  })
}

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw 'No database found!!';
}

module.exports = {
  mongoConnect,
  getDb,
}
