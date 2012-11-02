
/**
 * Module dependencies.
 */

var express = require('express')
  , scanner = require('./scanner')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  baseUrl='localhost:3000';
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
  baseUrl = 'http://linkscanner.us';
});

// Routes

app.get('/', function(req, res){
    console.log('loading mainpage');
    res.render('index', { title: 'LinkScanner',baseUrl:baseUrl });
});

app.get('/scan', function(req, res) {
    console.log('Scanning and shortening url...');       
    scanner.shorten(req.param('u'), function(result) {
        res.send(result);
    });
});

app.get('/:key', function(req,res) {
    scanner.resolve(req.param('key'), res, baseUrl);
});

// Listener
var port = process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
