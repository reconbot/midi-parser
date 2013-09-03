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

function systemRealTimeByte(byt) {
  return byt >= 0xF8 && byt <= 0xFF;
}

function commandByte(byt) {
  return byt >= 128;
}

Parser.prototype.write = function (data) {
  for (var i = 0; i < data.length; i++) {
    var byt = data[i];
    this.writeByte(byt);
  }
};

Parser.prototype.writeByte = function (byt) {

  if (systemRealTimeByte(byt)) {
    return this.emitMidi([byt]);
  }

  // if were not in a command and we recieve data we've probably lost
  // it someplace and we should wait for the next command
  if (this.buffer.length === 0 && !commandByte(byt)) {
    return;
  }

  if (this.buffer[0] === msg.START_SYSEX) {
    // emit commands
    if (byt === msg.END_SYSEX) {
      this.emit('sysex', this.buffer.slice(1));
      this.buffer.length = 0;
      return;
    }

    // Store data
    if (!commandByte(byt)) {
      return this.buffer.push(byt);
    }


    // Clear the buffer if another non realtime command was started
    if (commandByte(byt)) {
      this.buffer.length = 0;
    }

  }

  // If we recieve another command byte while in a command
  // emit the command and flush the buffer TODO HACK
  if (this.buffer.length > 1 && commandByte(byt)) {
    this.emitMidi(this.buffer.slice());
    this.buffer.length = 0;
  }

  this.buffer.push(byt);

  // if we have 3 bytes we have a midi command
  if (this.buffer.length === 3) {
    this.emitMidi(this.buffer.slice());
    this.buffer.length = 0;
    return;
  }

};

Parser.prototype.emitMidi = function (byt) {
  this.emit('midi', byt);
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

Parser.decodeString = function (buffer) {
  var decoded = [];
  for (var i = 0; i < buffer.length - 1; i += 2) {
    var _char = (buffer[i] & 0x7F) | (buffer[i + 1] << 7);
    decoded.push(_char);
  }
  return new Buffer(decoded).toString('ascii');
};
