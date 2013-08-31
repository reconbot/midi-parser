var Parser = require('../midi-parser');

var msg = Parser.msg;

module.exports.setUp = function (cb) {
  this.parser = new Parser();
  cb();
};

module.exports.writeSysx = function (test) {
  test.expect(1);
  var message = [Parser.msg.START_SYSEX, 99, Parser.msg.END_SYSEX];
  this.parser.on('sysx', function (data) {
    test.deepEqual(data, [99] );
    test.done();
  });
  this.parser.write(message);
};

module.exports.writeMidi = function (test) {
  test.expect(1);
  var message = [1, 99, 3];
  this.parser.on('midi', function (data) {
    test.deepEqual(data, message);
    test.done();
  });
  this.parser.write(message);
};

module.exports.writeMultiple = function (test) {
  test.expect(2);
  var midiCmd = [1, 2, 3];
  var sysxCmd = [55];

  this.parser.on('midi', function (data) {
    test.deepEqual(data, midiCmd);
  });

  this.parser.on('sysx', function (data) {
    test.deepEqual(data, sysxCmd);

  });

  var sysxMsg = [Parser.msg.START_SYSEX].concat(sysxCmd).concat([Parser.msg.END_SYSEX]);
  var message = midiCmd.concat(sysxMsg);
  this.parser.write(message);
  test.done();
};