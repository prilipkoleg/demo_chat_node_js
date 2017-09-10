var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('config');
var HttpError = require('error/index').HttpError;
var errorHandler = require('errorhandler');

// init app
var app = express();

// view engine setup
app.engine('ejs', require('ejs-locals'));
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'ejs');

/**
 * Attach middleware`s
 */
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// MongoDB session store
var sessionStore = require('lib/sessionStore');
//session
app.use(session({
  secret: config.get("session:secret"),
  key: config.get("session:key"),
  cookie: config.get("session:cookie"),
  saveUninitialized: true,
  resave: true,
  store: sessionStore
}));


app.use(require('middleware/sendHttpError'));

// loadUser middleware after session
app.use(require('middleware/loadUser'));

// tests middleware
app.use(function (req, res, next) {
  //req.session.numberOfVisits = req.session.numberOfVisits + 1 || 1;
  //res.send("Visits: " + req.session.numberOfVisits);
  //res.send("user: " + req.user);
  //res.sendHttpError(403);
  next();
});

/**
 * routes
 */
var index = require('./routes/index');
var user = require('./routes/user');
var chat = require('./routes/chat');

app.use('/', index);
app.use('/user', user);
app.use('/chat', chat);

/**
 * 404, Errors
 */

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  /*var err = new Error('Not Found');
  err.status = 404;
  err.message = "404 - Not Found!";*/
  next(new HttpError(404, "404 - Not Found!"));
});

app.use(function (err, req, res, next) {
  if (typeof err == 'number') {
    err = new HttpError(err);
  }

  if (err instanceof HttpError) {
    res.sendHttpError(err);
  } else {
    if (app.get('env') === 'development') {
      return errorHandler()(err, req, res, next);
    } else {
      var log = require('lib/log')(module);
      log.error(err);
      err = new HttpError(500);
      res.sendHttpError(err);
    }
  }
});


// error handler
/*app.use(function(err, req, res, next) {
  if(typeof err === 'number'){ // next(404);

  }
  // set locals, only providing error in development
  var is_dev = req.app.get('env') === 'development';
  res.locals.message = err.message ? err.message : "Something wrong";
  res.locals.error = is_dev ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {title: err.message});
});
*/
module.exports = app;