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
  var starts_sysx = this.buffer[0] === msg.START_SYSEX;
  var ends_sysx = this.buffer[last] === msg.END_SYSEX;

  if (starts_sysx && ends_sysx) {
    this.emit('sysx', this.buffer.slice(1, -1));
    this.buffer.length = 0;
    return;
  }

  if (!starts_sysx && this.buffer.length === 3) {
    this.emit('midi', this.buffer.slice());
    this.buffer.length = 0;
  }

};
