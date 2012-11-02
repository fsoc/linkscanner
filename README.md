Linkscanner
===
An urlshortener and malicious linkscanner in one. Share the shortened links and make sure they are and remain scanned by google's safe browsing API.

### Dependencies
    * node
    * redis

### Installation
install node.js from http://nodejs.org
install and run redis from http://redis.io
add nodemon to path
make a reverse proxy from your favourite webserver to localhost:3000

### running
    NODE_ENV=production nodemon app.js

### Advertisments
There are a few linkshorteners with ads on them, like linkbucks. This is your way of making a similiar solution (if you want) since the sites are opened in an iframe. Just add your ad in 728x90px in public/images and name it zyx<number>.gif and change the adurl in public/javascripts/app.js.
