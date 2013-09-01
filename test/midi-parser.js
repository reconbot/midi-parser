var Parser = require('../midi-parser');

var msg = Parser.msg;

module.exports.setUp = function (cb) {
  this.parser = new Parser();
  cb();
};

module.exports["write sysex"] = function (test) {
  test.expect(1);
  var message = [Parser.msg.START_SYSEX, 99, Parser.msg.END_SYSEX];
  this.parser.on('sysex', function (data) {
    test.deepEqual(data, [99]);
    test.done();
  });
  this.parser.write(message);
};

module.exports["write midi"] = function (test) {
  test.expect(2);
  var message = [1, 99, 3];
  var parser = this.parser;

  parser.on('midi', function (data) {
    test.deepEqual(data, message);
  });

  parser.write(message);
  test.equal(parser.buffer.length, 0);
  test.done();
};

module.exports["encodeString"] = function (test) {
  var message = "abc";
  var encoded_message = new Buffer([ 97, 0, 98, 0, 99, 0 ]);
  test.deepEqual(Parser.encodeString(message), encoded_message);
  test.done();
};

module.exports["decodeString"] = function (test) {
  var message = "xyz";
  var encoded_message = new Buffer([ 120, 0, 121, 0, 122, 0 ]);
  test.deepEqual(Parser.decodeString(encoded_message), message);
  test.done();
};

module.exports["decodeString with skip bytes"] = function (test) {
  var message = "xyz";
  var encoded_message = new Buffer([ 72, 88, 120, 0, 121, 0, 122, 0 ]);
  test.deepEqual(Parser.decodeString(encoded_message, 2), message);
  test.done();
};

