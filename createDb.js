var mongoose = require('lib/mongoose');
//mongoose.set('debug', true);
var async = require('async');
var User = require('models/user').User;

async.series([
  open,
  dropDatabase,
  requireModels,
  createUsers
], function (err, results) {
  console.log(arguments);
  mongoose.disconnect();
  process.exit(err ? 255 : 0);
});

function open(callback) {
  mongoose.connection.on('open', callback);
}

function dropDatabase(callback) {
  var db = mongoose.connection.db;
  db.dropDatabase(callback);
}

function requireModels(callback) {
  require('models/user');

  async.each(mongoose.models, function (modelName, callback) {
      modelName.ensureIndexes(callback);
    }, callback);
  // async.each(Object.keys(mongoose.models), function (modelName, callback) {
  //   mongoose.models[modelName].ensureIndexes(callback);
  // }, callback);
}

function createUsers(callback) {


  var users = [
    {username: 'Vasya', password: 'supervasya'},
    {username: 'Petya', password: '123'},
    {username: 'admin', password: 'thetruehero'}
  ];
  async.each(
    users,
    function (userData, callback) {
      var user = new mongoose.models.User(userData);
      user.save(callback);
    },
    callback);

  /*async.parallel([
    function (callback) {
      var vasya = new User({username: 'Vasya', password: 'supervasya'});
      vasya.save(function (err) {
        callback(err, vasya);
      })
    },
    function (callback) {
      var petya = new User({username: 'Petya', password: '123'});
      petya.save(function (err) {
        callback(err, petya);
      })
    },
    function (callback) {
      var admin = new User({username: 'admin', password: 'thetruehero'});
      admin.save(function (err) {
        callback(err, admin);
      })
    }
  ], callback);*/
}


/*
var user = new User({
  username: "Tester",
  password: 'secret'
});

user.save(function (err, user, affected) {
  if(err) throw err;
  console.log(arguments);
});


var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/chat';
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");

  db.close();
})*/
