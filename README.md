style-stream
============

Transform stream that reads HTML and writes all (inline and referenced) CSS used in it.


# Usage

```bash
style-stream http://npmjs.org/package/example
```
or

```
curl http://github.com/iojs | style-stream http://github.com
```

```javascript
var request = require('request'),
    styles = require('style-stream');
    
styles({url: 'http://npmjs.org/package/example'}))
  .pipe(process.stdout);
    
// or

request('http://npmjs.org/package/example')
.pipe(styles({baseurl: 'http://npmjs.org/package/example'}))
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
