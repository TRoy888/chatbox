var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var s = session({secret: 'ssshhhhh',saveUninitialized: true,resave: true})
var io = require('socket.io')();
require('./services/chat.io')(io);
/**
* Routes
*/
var routes = require('./routes/index');
var users = require('./routes/users');
var sessions = require('./routes/sessions');

var chat = require('./routes/chat');

var app = express();
io.use(function(socket, next) {
    s(socket.request, socket.request.res, next);
});
app.io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(s);

//initial db pool
var pool = require('./models/chatbox_pool');
pool.getConnection(function(err, connection){
  connection.on('error', function(err) {
        log("!!!Error:"+err)
        return;
  });
});

/**
* Routing
*/
app.use('/sessions', sessions);
app.use('/users', users);
app.get('/*', function(req, res, next){
  if(req.session.uid){
    next();
  }
  else{
    res.redirect('/sessions/create');
  }
});
app.use('/', routes);
app.use('/chat', chat);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
