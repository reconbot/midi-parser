var Parser = require('../midi-parser');

module.exports.setUp = function (cb) {
  this.parser = new Parser();
  cb();
};

module.exports.writeMessage = function (test) {
  test.done();
};

module.exports.buffer = function (test) {
  test.deepEqual(this.parser.buffer(), []);
  test.done();
};