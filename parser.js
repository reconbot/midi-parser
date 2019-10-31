const { EventEmitter } = require('events')

function channelCmd(byt) {
  return byt >= 0x80 && byt <= 0xEF
}

function dataLength(cmd) {
  if (channelCmd(cmd)) {
    cmd = cmd & 0xF0
  }
  let length = msgLength[cmd]
  // if we don't know how many data bytes we need assume 2
  if (length === undefined) {
    length = 2
  }
  return length
}

function systemRealTimeByte(byt) {
  return byt >= 0xF8 && byt <= 0xFF
}

function commandByte(byt) {
  return byt >= 128
}

class Parser extends EventEmitter {
  constructor() {
    super()
    this.buffer = []
  }

  write(data) {
    for (const byte of data) {
      this.writeByte(byte)
    }
  }

  writeByte(byte) {
    if (systemRealTimeByte(byte)) {
      return this.emitMidi([byte])
    }

    // if were not in a command and we receive data we've probably lost
    // it someplace and we should wait for the next command
    if (this.buffer.length === 0 && !commandByte(byte)) {
      return
    }

    if (this.buffer[0] === msg.startSysex) {
    // emit commands
      if (byte === msg.endSysex) {
        this.emitSysEx(this.buffer.slice(1))
        this.buffer = []
        return
      }

      // Store data
      if (!commandByte(byte)) {
        return this.buffer.push(byte)
      }


      // Clear the buffer if another non realtime command was started
      if (commandByte(byte)) {
        this.buffer = []
      }
    }

    this.buffer.push(byte)

    // once we have enough data bytes emit the cmd
    if (dataLength(this.buffer[0]) === (this.buffer.length - 1)) {
      this.emitMidi(this.buffer.slice())
      this.buffer = []
      return
    }
  }

  emitMidi(bytes) {
    if (channelCmd(bytes[0])) {
      const cmd = bytes[0] & 0xF0
      const channel = bytes[0] & 0x0F
      return this.emit('midi', cmd, channel, bytes.slice(1))
    }
    this.emit('midi', bytes[0], null, bytes.slice(1))
  }

  emitSysEx(bytes) {
    this.emit('sysex', bytes[0], bytes.slice(1))
  }
}

module.exports = Parser

// Commands that have names that we care about
const msg = Parser.msg = {
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
}

// Commands that have a specified lengths for their data
// I wish there were actual rules around this
const msgLength = Parser.msgLength = {}
msgLength[msg.timeCode] = 1
msgLength[msg.songPos] = 2
msgLength[msg.songSel] = 1
msgLength[msg.tuneReq] = 0
msgLength[msg.noteOff] = 2
msgLength[msg.noteOn] = 2
msgLength[msg.polyAT] = 2
msgLength[msg.ctrlChg] = 2
msgLength[msg.progChg] = 1
msgLength[msg.chanPressure] = 1
msgLength[msg.pitchBnd] = 2

Parser.encodeValue = function (buffer) {
  const encoded = []
  for (let i = 0; i < buffer.length; i += 1) {
    encoded.push(buffer[i] & 0x7F) // The bottom 7 bits of the byte LSB
    encoded.push(buffer[i] >> 7 & 0x7F) // The top 1 bit of the byte MSB
  }

  return Buffer.from(encoded)
}

Parser.encodeString = function (buffer) {
  if (typeof buffer === 'string') {
    buffer = Buffer.from(buffer, 'ascii')
  }
  return Parser.encodeValue(buffer)
}

Parser.decodeValue = function (buffer) {
  const decoded = []
  for (let i = 0; i < buffer.length - 1; i += 2) {
    const _char = (buffer[i] & 0x7F) | (buffer[i + 1] << 7)
    decoded.push(_char)
  }
  return Buffer.from(decoded)
}

Parser.decodeString = function (buffer) {
  return Parser.decodeValue(buffer).toString('ascii')
}
