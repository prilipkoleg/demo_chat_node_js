function sendHttpError(req, res, next) {
//console.log(req, res);

  res.sendHttpError = function(error) {

    res.status(error.status);
    if (res.req.headers['x-requested-with'] == 'XMLHttpRequest') {
      res.json(error);
    } else {
      res.render("error", {error: error});
    }
  };

  res.locals.helpers = {
    now: function() {
      return new Date().toString();
    }
  };

  next();

};

module.exports = sendHttpError;