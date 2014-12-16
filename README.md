style-stream
============

Transform stream that reads HTML and writes all (inline and referenced) CSS used in it.


# Usage

```javascript
var request = require('request'),
    styles = require('style-stream');

request('http://google.com')
.pipe(styles({baseurl: 'http://google.com'}))
.pipe(process.stdout);

```

or

```javascript
var fs = require('fs'),
    styles = require('style-stream');

fs.createReadStream(__dirname + '/index.html')
.pipe(styles({basepath: __dirname}))
.pipe(process.stdout);
```
