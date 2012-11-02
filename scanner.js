/*
 * Globals
 */
var crypto = require('crypto'), redis, valid_url_pattern = new RegExp(/^https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w/_\.]*(\?\S+)?)?)?/);
var googleApiKey = 'ABQIAAAAUAiBUe2ZQVy06xBAhqRpThTxhpUe-z_CEf6r4ETB7sttuJ6keg';
var sys = require('sys'),
    http = require('http'),
    https = require('https'),
    urllib = require('url');

/*
 * Configure Redis
 */
if (process.env.REDISTOGO_URL) {
	var rtg   = require("url").parse(process.env.REDISTOGO_URL);
	redis = require("redis").createClient(rtg.port, rtg.hostname);
	redis.auth(rtg.auth.split(":")[1]);
} else {
	redis = require('redis-url').createClient();
}

/*
 * Shorten a given url
 */
function shorten(url,callback) {
	console.log("Shortening " + url);
	var result = new Object();
	if (valid_url_pattern.exec(url) == null) {
		url = "http://" + url;
	}
	var identifier = createIdentifier(url);
    
    //Enter the URL and try to get the title, the result is saved asynchroniously in redis 
    getTitle(url, function(title, isSameOrigin) {
        console.log('got title: '+title);
        var titled = new Object();
        titled.identifier = identifier;
        titled.data= {'title':title, 'isSameOrigin':isSameOrigin}; 
        store(titled); 
    });
   
    //scan the URL and when it is done save it in redis 
    scanUrl(url, function(safetystatus) {
        console.log("the site is: "+safetystatus);
	    var shortened = createObject(identifier, url,safetystatus);
        
        if (store(shortened)) {
            result.key = identifier;
            result.success = true;
            result.safetystatus = safetystatus;
        } else {
            result.success = false;
            result.message = "Error: Could not store key";
        }
        callback(result);
    });
}

/*
 * Resolve url based on hash
 */
function resolve(identifier, response, baseUrl) {
	console.log("Resolving " + identifier);
    var title='';
	redis.hgetall(identifier, function(err, data) {
		if (data.url == undefined || data == null) {
			response.send(404);
		} else {
            console.log('found url:'+data.url);
			redis.hincrby(identifier, "hits", 1);
			redis.hset(identifier, "accessed", new Date());
            
            if(data.isSameOrigin == 'true') {
                response.redirect(data.url);
            }
            else {
                if ( data.title != null)
                    title = data.title;
                    response.render('resolve',{ title:title, url:data.url, safetystatus:data.safetystatus, baseUrl:baseUrl });
            }
		}
	});
}

/*
 * Create unique identifier using SHA1 hash plus random salt
 * so same urls will still produce unique hash
 */
function createIdentifier(url) {
	var hash = crypto.createHash('sha1');
	hash.update(url + randomSalt());
	var digest = hash.digest('hex').substring(0, 6);
	return digest;
}

/*
 * Create JSON object
 */
function createObject(identifier, url, safetystatus) {
	var shortened = new Object();
	shortened.identifier = identifier;
    shortened.data = {
    'created':shortened.created = new Date(),
    'accessed':	shortened.accessed = new Date(),
    'url':shortened.url = url,
    'safetystatus':safetystatus,
    'hits':0
    };

	return shortened;
}

/*
 * Store object in Redis
 */
function store(shortened) {
    console.log('storing:'+shortened.identifier);

    return redis.hmset(shortened.identifier,shortened.data);
}


/*
 * Generate random salt
 */
function randomSalt() {
	var iteration = 0;
	var salt = "";
	var randomNumber;
	if(special == undefined){
	      var special = false;
	}
	while(iteration < 10){
	   randomNumber = (Math.floor((Math.random() * 100)) % 94) + 33;
    if(!special){
      if ((randomNumber >=33) && (randomNumber <=47)) { continue; }
      if ((randomNumber >=58) && (randomNumber <=64)) { continue; }
      if ((randomNumber >=91) && (randomNumber <=96)) { continue; }
      if ((randomNumber >=123) && (randomNumber <=126)) { continue; }
    }
    iteration++;
    salt += String.fromCharCode(randomNumber);
  }
  return salt;
}

/*
 * Get the title of the page
 */
function getTitle(url, callback) {
    var urlObject = require('url').parse(url);
    var titlePattern = new RegExp(/<title>([^\<]*)<\/title>/);
     
    var options = {
        host: urlObject.hostname,
        port: urlObject.port,
        path: urlObject.pathname 
    };

    http.get(options, function(res) {
        console.log(res.statusCode);
        var isSameOrigin='false';
        if(res.headers['x-frame-options'] == 'SAMEORIGIN') {
            isSameOrigin='true';
        }
        res.setEncoding('utf8');
        res.on('data', function(data) {
            if(match = titlePattern.exec(data))
                if(match[1] && res.statusCode==200) {
                    callback(match[1], isSameOrigin);
                }
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}
 
/*
 * Scan an url against google safebrowsing API 
 */
function scanUrl(url, callback) {
    var urlObject = require('url').parse(url);
    console.log('looking up:'+url); 
    var options = {
        host: 'sb-ssl.google.com',
        port: '443',
        path: '/safebrowsing/api/lookup?client=firefox&apikey='+googleApiKey+'&appver=1.5.2&pver=3.0&url='+url 
    };

    https.get(options, function(res) {
        console.log('google['+url+']: '+res.statusCode);
        if(url!='http://bad.com' && res.statusCode == 204)
            callback('safe');
        else
            callback('unsafe');
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}
        

exports.shorten = shorten;
exports.resolve = resolve;
