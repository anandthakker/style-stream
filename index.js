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
  opts = opts || { baseurl: null }

  var horn = trumpet()
  var styles = next([])
  var pending = 0

  if (reHttp.test(opts.url)) {
    var source = opts.url
    opts.baseurl = opts.url
    delete opts.url
    return request(source).pipe(stylestream(opts))
  }

  horn.selectAll('link', function (elem) {
    elem.getAttributes(function (attributes) {
      if (((attributes.rel || '').toLowerCase() === 'stylesheet') ||
        (typeof attributes.rel === 'undefined') && attributes.href) {
        try {
          pushStreamForLocation(elem, attributes)
        } catch (e) {
          styles.emit('error', e)
        }
      }
    })
  })

  horn.selectAll('style', function (elem) {
    elem.getAttributes(function (attributes) {
      comment({ element: elem.name, attributes: attributes })
      if (!opts.sourcesOnly) {
        styles.push(elem.createReadStream())
      }
    })
  })

  horn.on('end', closeStyles)

  return duplexer(horn, styles)

  function comment (c) {
    if (!(opts.sourceComments || opts.sourcesOnly)) { return }
    c = JSON.stringify(c)
    if (opts.sourceComments) { c = '/* ' + c + ' */' }
    styles.push('\n' + c + '\n')
  }
  function pushStreamForLocation (elem, attributes) {
    var loc = attributes.href
    var isHttp = reHttp.test(loc)
    if (reHttp.test(opts.baseurl)) {
      isHttp = true
      loc = url.resolve(opts.baseurl, loc)
    }
    comment({ element: elem.name, attributes: attributes, resolved: loc })
    if (opts.sourcesOnly) { return }

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
    if (pending-- <= 0 && !opts.sourcesOnly) {
      styles.close()
    }
  }
}

if (require.main === module) {
  var argv = require('minimist')(process.argv.slice(2))
  var out
  if (process.stdin.isTTY) {
    argv.url = argv.url || argv._[0]
    out = stylestream(argv)
  } else {
    argv.basepath = argv.basepath || argv._[0]
    out = process.stdin
      .pipe(stylestream(argv))
  }
  out.pipe(process.stdout)
}
