var request = require('request'),
    styles = require('./');

request(process.argv[2])
.pipe(styles({baseurl: process.argv[2]}))
.pipe(process.stdout);
