var User = require('models/user').User;

module.exports = function(req, res, next) {
  //assert(req.session);
  req.user = res.locals.user = null;

  if (!req.session.user) return next();

  User.findById(req.session.user).exec(function(err, user) {
    if (err) return next(err);
    //res.locals to all views
    req.user = res.locals.user = user;
    next();
  });

};