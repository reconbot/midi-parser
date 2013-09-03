var Parser = require('../parser');
var sinon = require('sinon');
var msg = Parser.msg;

var soundOff = [ 188, 120, 0 ]; // All Sound Off
var systemReset = [ 0xFF ]; // System Realtime Command

module.exports.setUp = function (cb) {
  this.parser = new Parser();
  cb();
};

var describe = module.exports;

describe["#emitMidi"] = function (test) {
  var spy = sinon.spy();
  test.expect(1);
  this.parser.on('midi', spy);
  this.parser.emitMidi(soundOff);
  test.ok(spy.calledWith(soundOff), "emits the midi command");
  test.done();
};

describe["sysex command"] = function (test) {
  var message = [msg.startSysex, 99, msg.endSysex];
  var spy = sinon.spy();
  test.expect(1);
  this.parser.on('sysex', spy);
  this.parser.write(message);
  test.ok(spy.calledWith([99]), "sysex command emitted");
  test.done();
};

describe["sysex command during command"] = function (test) {
  var message = [msg.startSysex, msg.startSysex, 99, msg.endSysex];
  var spy = sinon.spy();
  test.expect(1);
  this.parser.on('sysex', spy);
  this.parser.write(message);
  test.ok(spy.calledWith([99]), "sysex command emitted");
  test.done();
};

describe["midi command"] = function (test) {
  var spy = sinon.spy();
  test.expect(1);
  this.parser.on('midi', spy);
  this.parser.write(soundOff);
  test.ok(spy.calledWith(soundOff), "midi command emitted");
  test.done();
};

describe["Command during a Sysex Command clears current Sysex"] = function (test) {
  var spy = sinon.spy();
  test.expect(1);
  this.parser.on('midi', spy);
  this.parser.write([msg.startSysex]);
  this.parser.write(soundOff);
  test.ok(spy.calledWith(soundOff), "midi command emitted");
  test.done();
};

describe["midi System Realtime Commands emit immediately"] = function (test) {
  var spy = sinon.spy();
  test.expect(1);
  this.parser.on('midi', spy);
  this.parser.write(systemReset);
  test.ok(spy.calledWith(systemReset), 'realtime command emited');
  test.done();
};

describe["midi System Realtime Commands emit during sysex"] = function (test) {
  var spy = sinon.spy();
  test.expect(2);
  this.parser.on('midi', spy);
  this.parser.on('sysex', spy);
  this.parser.write([msg.startSysex, systemReset[0], 99, msg.endSysex]);
  test.deepEqual(spy.getCall(0).args[0], systemReset, 'realtime command emited');
  test.deepEqual(spy.getCall(1).args[0], [99], 'sysex command emited');
  test.done();
};

describe["midi System Realtime Commands emit during midi"] = function (test) {
  var spy = sinon.spy();
  var mixed = [ 188, 0xFF, 120, 0 ];
  test.expect(2);
  this.parser.on('midi', spy);
  this.parser.write(mixed);
  test.deepEqual(spy.getCall(0).args[0], systemReset, 'realtime command emited');
  test.deepEqual(spy.getCall(1).args[0], soundOff, 'midi command emited');
  test.done();
};

describe["midi single byte commands"] = function (test) {
  var spy = sinon.spy();
  test.expect(1);
  this.parser.on('midi', spy);
  this.parser.write([msg.tuneReq]); // [0xF6]
  test.ok(spy.calledWith([msg.tuneReq]), "Single byte command emitted");
  test.done();
};

describe["midi channel voice messages"] = function (test) {
  var noteOnChan2 = msg.noteOn + 2;
  var packet = [noteOnChan2, 0, 0];
  var spy = sinon.spy();
  test.expect(1);
  this.parser.on('midi', spy);
  this.parser.write(packet);
  test.ok(spy.calledWith(packet), "Channel voice message");
  test.done();
};

describe["midi channel voice messages with 1 data byte"] = function (test) {
  var chanPressure2 = msg.chanPressure + 2;
  var packet = [chanPressure2, 0];
  var spy = sinon.spy();
  test.expect(1);
  this.parser.on('midi', spy);
  this.parser.write(packet);
  test.ok(spy.calledWith(packet), "Channel voice message");
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