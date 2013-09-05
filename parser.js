var util = require("util");
var events = require('events');

var Parser = module.exports = function () {
  if (!(this instanceof Parser)) {
    return new Parser();
  }
  events.EventEmitter.call(this);
  this.buffer = [];
};

util.inherits(Parser, events.EventEmitter);

// Commands that have names that we care about
var msg = Parser.msg = {
  noteOff: 0x80,
  noteOn: 0x90, // 144
  polyAT: 0xA0, // 160
  ctrlChg: 0xB0, // 176
  progChg: 0xC0, // 192
  chanPressure: 0xD0, // 208
  pitchBnd: 0xE0,
  startSysex: 0xF0, // 240
  endSysex: 0xF7, // 247
  timeCode: 0xF1, // 241
  songPos: 0xF2,
  songSel: 0xF3,
  tuneReq: 0xF6
};

// Commands that have a specified lengths for their data
// I wish there were actual rules around this
var msgLength = Parser.msgLength = {};
msgLength[msg.timeCode]     = 1;
msgLength[msg.songPos]      = 2;
msgLength[msg.songSel]      = 1;
msgLength[msg.tuneReq]      = 0;
msgLength[msg.noteOff]      = 2;
msgLength[msg.noteOn]       = 2;
msgLength[msg.polyAT]       = 2;
msgLength[msg.ctrlChg]      = 2;
msgLength[msg.progChg]      = 1;
msgLength[msg.chanPressure] = 1;
msgLength[msg.pitchBnd]     = 2;

function channelCmd(byt) {
  return byt >= 0x80 && byt <= 0xEF;
}

function dataLength(cmd) {
  if (channelCmd(cmd)) {
    cmd = cmd & 0xF0;
  }
  var length = msgLength[cmd];
  // if we don't know how many data bytes we need assume 2
  if (length === undefined) {
    length = 2;
  }
  return length;
}

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

  if (this.buffer[0] === msg.startSysex) {
    // emit commands
    if (byt === msg.endSysex) {
      this.emitSysEx(this.buffer.slice(1));
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

  this.buffer.push(byt);

  // once we have enough data bytes emit the cmd
  if (dataLength(this.buffer[0]) === (this.buffer.length - 1)) {
    this.emitMidi(this.buffer.slice());
    this.buffer.length = 0;
    return;
  }

};

Parser.prototype.emitMidi = function (byts) {
  if (channelCmd(byts[0])) {
    var cmd = byts[0] & 0xF0;
    var channel = byts[0] & 0x0F;
    return this.emit('midi', cmd, channel, byts.slice(1));
  }
  this.emit('midi', byts[0], null, byts.slice(1));
};

Parser.prototype.emitSysEx = function (byts) {
  this.emit('sysex', byts[0], byts.slice(1));
};

Parser.encodeValue = function (buffer) {
  var encoded = [];
  for (var i = 0; i < buffer.length; i += 1) {
    encoded.push(buffer[i] & 0x7F); // The bottom 7 bits of the byte LSB
    encoded.push(buffer[i] >> 7 & 0x7F); // The top 1 bit of the byte MSB
  }

  return new Buffer(encoded);
};

Parser.encodeString = function (buffer) {
  var encoded = [];
  if (typeof buffer === 'string') {
    buffer = new Buffer(buffer, 'ascii');
  }
  return Parser.encodeValue(buffer);
};

Parser.decodeValue = function (buffer) {
  var decoded = [];
  for (var i = 0; i < buffer.length - 1; i += 2) {
    var _char = (buffer[i] & 0x7F) | (buffer[i + 1] << 7);
    decoded.push(_char);
  }
  return new Buffer(decoded);
};

Parser.decodeString = function (buffer) {
  return Parser.decodeValue(buffer).toString('ascii');
};
