var util = require("util");
var events = require('events');

var Parser = module.exports = function () {
  events.EventEmitter.call(this);
  this.buffer = [];
};

util.inherits(Parser, events.EventEmitter);

var msg = Parser.msg = {
  START_SYSEX: 240, // 0xF0,
  END_SYSEX: 247 //0xF7
};

Parser.prototype.write = function (data) {
  for (var i = 0; i < data.length; i++) {
    var byt = data[i];
    this.writeByte(byt);
  }
};

Parser.prototype.writeByte = function (byt) {
  this.buffer.push(byt);

  var last = this.buffer.length - 1;
  var starts_sysex = this.buffer[0] === msg.START_SYSEX;
  var ends_sysex = this.buffer[last] === msg.END_SYSEX;
  var last_is_command = this.buffer[last] >= 128;

  // if were not recieveing a command byte as the begining of our buffer
  // we've probably lost it someplace and we should wait for the next command
  if (this.buffer.length === 1 && !last_is_command) {
    this.buffer.length = 0;
    return;
  }

  // Woo it's a full sysex command!
  if (starts_sysex && ends_sysex) {
    this.emit('sysex', this.buffer.slice(1, -1));
    this.buffer.length = 0;
    return;
  }

  // Let's move on the exciting parts are still to come
  if (starts_sysex) {
    return;
  }

  // if we have 3 bytes we have a midi command
  if (this.buffer.length === 3) {
    this.emit('midi', this.buffer.slice());
    this.buffer.length = 0;
    return;
  }

  // If we recieve another command byte (msb == 1) while one is in the buffer
  // emit the command and flush the buffer execept the last
  if (this.buffer.length > 1 && last_is_command) {
    this.emit('midi', this.buffer.slice(0, -1));
    this.buffer.length = 1;
    this.buffer[0] = byt;
    return;
  }

};

Parser.encodeString = function (buffer) {
  var encoded = [];
  if (typeof buffer === 'string') {
    buffer = new Buffer(buffer, 'ascii');
  }

  for (var i = 0; i < buffer.length; i += 1) {
    encoded.push(buffer[i] & 0x7F); // The bottom 7 bits of the byte LSB
    encoded.push(buffer[i] >> 7 & 0x7F); // The top 1 bit of the byte MSB
  }

  return new Buffer(encoded);
};

Parser.decodeString = function (buffer, start) {
  var decoded = [];
  for (var i = (start || 0); i < buffer.length - 1; i += 2) {
    var _char = (buffer[i] & 0x7F) | (buffer[i + 1] << 7);
    decoded.push(_char);
  }
  return new Buffer(decoded).toString('ascii');
};
