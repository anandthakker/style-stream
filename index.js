var fs = require('fs'),
  url = require('url'),
  path = require('path'),
  trumpet = require('trumpet'),
  through = require('through2'),
  next = require('next-stream'),
  duplexer = require('duplexer2'),
  request = require('request');

module.exports = stylestream;

var reHttp = /^http/;

function stylestream(opts) {
  var horn = trumpet(),
    styles = next([]);

  opts = opts || {
    baseurl: null,
    basepath: null
  }

  horn.selectAll('link', function(elem) {
    elem.getAttribute('href', function(loc) {
      styles.push(createStream(loc));
    });
  });

  horn.selectAll('style', function(elem) {
    styles.push(elem.createReadStream());
  });
  
  horn.on('end', function() {
    styles.close();
  });

  return duplexer(horn, styles);


  function createStream(loc) {
    var isHttp = reHttp.test(loc);
    if (reHttp.test(opts.baseurl)) {
      isHttp = true;
      loc = url.resolve(opts.baseurl, loc);
    }
    if (isHttp) return request(loc);
    else if (opts.basepath) return fs.createReadStream(path.resolve(opts.basepath, loc));
    else throw new Error('Cannot resolve href without a baseurl or basepath.')
  }
}



if (require.main === module) {
  process.stdin
    .pipe(stylestream({basepath: process.argv[2]}))
    .pipe(process.stdout);
}
