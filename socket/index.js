var async = require('async');
var cookieParser = require('cookie-parser');
var config = require('config');
var log = require('lib/log')(module);
var cookie = require('cookie');
var sessionStore = require('lib/sessionStore');
var HttpError = require('error').HttpError;
var User = require('models/user').User;

function loadSession(sid, callback) {

  sessionStore.load(sid, function (err, session) {
    if (arguments.length === 0){
      // no arguments => no session
      return callback(null, null);
    }else{
      return callback(null, session);
    }
  })

}

function loadUser(session, callback) {

  if(!session.user){
    log.debug("Session %s is anonymous", session.id);
    return callback(null, null);
  }

  log.debug("retriever user ", session.user);

  User.findById(session.user, function (err, user) {
    if (err) return callback(err);

    if(!user) return callback(null, null);

    log.debug("user findByID result: " + user);
    callback(null, user);
  });

}


module.exports = function (server) {

  var io = require('socket.io').listen(server);
  //io.attach(server);
  io.origins('localhost:*');


  io.use(function(socket, next) {
    var handshakeData = socket.request;

    async.waterfall([
      function (callback) {
        // make handshakeData.cookies - object with cookies
        handshakeData.cookies = cookie.parse(handshakeData.headers.cookie || "");
        var sidCookie = handshakeData.cookies[config.get('session:key')]; // s:QWERTY.SHA
        //var sid = connect.utils.parseSignedCookie(sidCookie,config.get('session:secret'));
        var sid = cookieParser.signedCookie(sidCookie,config.get('session:secret'));

        loadSession(sid, callback);
      },
      function (session, callback) {

        if(!session) {
          callback(new HttpError(401, "No session"));
        }

        handshakeData.session = session;
        loadUser(session, callback);
      },
      function (user, callback) {

        if(!user){
            callback(new HttpError(403, "Anonymous session may not connect"));
        }

        handshakeData.user = user;
        callback(null);
      }
    ], function (err) {

      if(err){
        return next(err);
      }

      next();
    });

  });

  io.sockets.on('session:reload', function (sid) {
    var clients = io.sockets.clients();
    
    clients.forEach(function (client) {
      if (client.request.session.id != sid) return;

      loadSession(sid, function (err, session) {
        if (err){
          client.emit("error", "server error");
          client.disconnect();
          return;
        }

        if (!session){
          client.emit("logout");
          client.disconnect();
          return;
        }

        client.request.session = session;

      });

    })
  });

  io.sockets.on('connection', function (socket) {

    var username = socket.request.user.get('username');

    socket.broadcast.emit('join', username);

    socket.on('message', function (text, cb) {
      socket.broadcast.emit('message', username, text);
      cb && cb();
    });

    socket.on('disconnect', function () {
      socket.broadcast.emit('leave', username);
    });

  });

  return io;

};

