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
    styles = next([]),
    pending = 0;

  opts = opts || {
    baseurl: null,
    basepath: null
  }
  
  if(reHttp.test(opts.url)) {
    return request(opts.url).pipe(stylestream({
      baseurl: opts.url,
      basepath: null
    }));
  }

  horn.selectAll('link', function(elem) {
    elem.getAttributes(function(attributes) {
      if('stylesheet' === ((attributes.rel || '').toLowerCase()) ||
        ('undefined' === typeof attributes.rel) &&
        attributes.href)
      pushStreamForLocation(attributes.href);
    });
  });

  horn.selectAll('style', function(elem) {
    styles.push(elem.createReadStream());
  });
  
  horn.on('end', closeStyles);

  return duplexer(horn, styles);


  function pushStreamForLocation(loc) {
    var isHttp = reHttp.test(loc);
    if (reHttp.test(opts.baseurl)) {
      isHttp = true;
      loc = url.resolve(opts.baseurl, loc);
    }
    if (isHttp) {
      pending++;
      var stream = request(loc).pipe(through());
      stream.on('end', closeStyles);
      styles.push(stream);
    }
    else if (opts.basepath) styles.push(fs.createReadStream(path.resolve(opts.basepath, loc)));
    else throw new Error('Cannot resolve href without a baseurl or basepath.')
  }
  
  function closeStyles() {
    if(pending-- <= 0) {
      styles.close();
    }
  }
}



if (require.main === module) {
  if(process.stdin.isTTY) {
    stylestream({url: process.argv[2]})
    .pipe(process.stdout);
  }
  else {
    process.stdin
    .pipe(stylestream({basepath: process.argv[2]}))
    .pipe(process.stdout);
  }
}
