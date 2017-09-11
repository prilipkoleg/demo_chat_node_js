var express = require('express');
var router = express.Router();
var User = require('../models/user').User;
var AuthError = require('../models/user').AuthError;
var HttpError = require('../error').HttpError;
var ObjectId = require('mongodb').ObjectID;

router.get('/login', function (req, res) {
  res.render('login', {title: 'Регистрация и вход'});
});

router.post('/login', function (req, res, next) {
  var username = req.body.username;
  var password = req.body.password;

  User.authorize(username, password, function (err, user) {
    if (err) {
      if(err instanceof AuthError){
        return next(new HttpError(403, err.message));
      }else{
        return next(err);
      }
    }

    req.session.user = user._id;
    res.send({});
  });
});

router.post('/logout', function (req, res, next) {
  var sid = req.session.id;
  var io = req.app.get('io');

  req.session.destroy(function (err) {
    //io.socket.$emit("session:reload", sid);
    if (err) return next(err);

    res.redirect('/');
  });
});

module.exports = router;
