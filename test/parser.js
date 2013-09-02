var Parser = require('../parser');
var sinon = require('sinon');
var msg = Parser.msg;

var soundOff = [ 188, 120, 0 ]; // All Sound Off
var systemReset = [ 0xFF ];

module.exports.setUp = function (cb) {
  this.parser = new Parser();
  cb();
};

var describe = module.exports;

describe["emit sysex"] = function (test) {
  test.expect(1);
  var message = [msg.START_SYSEX, 99, msg.END_SYSEX];
  this.parser.on('sysex', function (data) {
    test.deepEqual(data, [99]);
    test.done();
  });
  this.parser.write(message);
};

describe["#emitMidi"] = function (test) {
  var spy = sinon.spy();
  test.expect(1);
  this.parser.on('midi', spy);
  this.parser.emitMidi(soundOff);
  test.ok(spy.calledWith(soundOff), "emits the midi message");
  test.done();
};

describe["emit midi message"] = function (test) {
  var spy = sinon.spy();
  test.expect(1);
  this.parser.on('midi', spy);
  this.parser.write(soundOff);
  test.deepEqual(spy.getCall(0).args[0], soundOff);
  test.done();
};

describe["midi System Realtime Messages emit immediately"] = function (test) {
  var spy = sinon.spy();
  test.expect(1);
  this.parser.on('midi', spy);
  this.parser.write(systemReset);
  test.deepEqual(spy.getCall(0).args[0], systemReset, 'realtime message emited');
  test.done();
};

describe["midi System Realtime Messages emit during sysex"] = function (test) {
  var spy = sinon.spy();
  test.expect(2);
  this.parser.on('midi', spy);
  this.parser.on('sysex', spy);
  this.parser.write([msg.START_SYSEX, systemReset[0], 99, msg.END_SYSEX]);
  test.deepEqual(spy.getCall(0).args[0], systemReset, 'realtime message emited');
  test.deepEqual(spy.getCall(1).args[0], [99], 'sysex message emited');
  test.done();
};

describe["midi System Realtime Messages emit during midi"] = function (test) {
  var spy = sinon.spy();
  var mixed = [ 188, 0xFF, 120, 0 ];
  test.expect(2);
  this.parser.on('midi', spy);
  this.parser.write(mixed);
  test.deepEqual(spy.getCall(0).args[0], systemReset, 'realtime message emited');
  test.deepEqual(spy.getCall(1).args[0], soundOff, 'midi message emited');
  test.done();
};

describe[".encodeString"] = function (test) {
  var message = "abc";
  var encoded_message = new Buffer([ 97, 0, 98, 0, 99, 0 ]);
  test.deepEqual(Parser.encodeString(message), encoded_message);
  test.done();
};

describe[".decodeString"] = function (test) {
  var message = "xyz";
  var encoded_message = new Buffer([ 120, 0, 121, 0, 122, 0 ]);
  test.deepEqual(Parser.decodeString(encoded_message), message);
  test.done();
};