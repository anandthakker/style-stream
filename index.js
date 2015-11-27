#!/usr/bin/env node

var fs = require('fs')
var url = require('url')
var path = require('path')
var trumpet = require('trumpet')
var through = require('through2')
var next = require('next-stream')
var duplexer = require('duplexer2')
var request = require('request')

module.exports = stylestream

var reHttp = /^http/

function stylestream (opts) {
  var horn = trumpet()
  var styles = next([])
  var pending = 0

  opts = opts || { baseurl: null }

  if (reHttp.test(opts.url)) {
    return request(opts.url).pipe(stylestream({
      baseurl: opts.url,
      basepath: null
    }))
  }

  horn.selectAll('link', function (elem) {
    elem.getAttributes(function (attributes) {
      if (((attributes.rel || '').toLowerCase() === 'stylesheet') ||
        (typeof attributes.rel === 'undefined') && attributes.href) {
        try {
          pushStreamForLocation(attributes.href)
        } catch (e) {
          styles.emit('error', e)
        }
      }
    })
  })

  horn.selectAll('style', function (elem) {
    styles.push(elem.createReadStream())
  })

  horn.on('end', closeStyles)

  return duplexer(horn, styles)

  function pushStreamForLocation (loc) {
    var isHttp = reHttp.test(loc)
    if (reHttp.test(opts.baseurl)) {
      isHttp = true
      loc = url.resolve(opts.baseurl, loc)
    }
    if (isHttp) {
      pending++
      var stream = request({
        method: 'GET',
        uri: loc,
        gzip: true
      }).pipe(through())
      stream.on('end', closeStyles)
      styles.push(stream)
    }
    else if (opts.basepath) styles.push(fs.createReadStream(path.resolve(opts.basepath, loc)))
    else if (typeof opts.basepath === 'undefined') throw new Error('Cannot resolve href without a baseurl or basepath.')
  }

  function closeStyles () {
    if (pending-- <= 0) {
      styles.close()
    }
  }
}

if (require.main === module) {
  if (process.stdin.isTTY) {
    stylestream({url: process.argv[2]})
      .pipe(process.stdout)
  } else {
    process.stdin
      .pipe(stylestream({basepath: process.argv[2]}))
      .pipe(process.stdout)
  }
}
