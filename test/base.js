
var fs = require('fs'),
    test = require('tape'),
    concat = require('concat-stream'),
    stylestream = require('../')
    
test('resolving <link> element', function(t) {
  fs.createReadStream(__dirname + '/link.html')
  .pipe(stylestream({basepath: __dirname}))
  .pipe(concat({encoding: 'string'}, function(data) {
    t.equal(data, fs.readFileSync(__dirname + '/link.css').toString())
    t.end()
  }))
})

test('<style> element', function(t) {
  fs.createReadStream(__dirname + '/style.html')
  .pipe(stylestream({basepath: __dirname}))
  .pipe(concat({encoding: 'string'}, function(data) {
    t.equal(data.trim(), '.container { width: 900px; margin: 0 auto; }')
    t.end()
  }))
})

test('error with no basepath', function(t) {
  fs.createReadStream(__dirname + '/link.html')
  .pipe(stylestream({}))
  .on('error', function (e) {
    t.ok(e)
    t.end()
  })
  .resume()
})
