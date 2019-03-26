const assert = require('assert')
const Parser = require('../parser')
const sinon = require('sinon')
const msg = Parser.msg

const soundOff = [188, 120, 0] // All Sound Off - parsed it looks like  (176, 12, [120, 0])
const systemReset = [0xFF] // System Realtime Command

describe('midi-parser', () => {
  let parser
  beforeEach(() => {
    parser = new Parser()
  })

  it("#emitMidi", () => {
    const spy = sinon.spy()
    parser.on('midi', spy)
    parser.emitMidi(soundOff)
    const called = spy.calledWith(176, 12, [120, 0])
    assert.ok(called, "emits the midi command")
  })

  it("#emitSysEx", () => {
    const spy = sinon.spy()
    parser.on('sysex', spy)
    const message = [99, 0, 0]
    parser.emitSysEx(message)
    const called = spy.calledWith(99, [0, 0])
    assert.ok(called, "emits the sysex command")
  })

  it("sysex command", () => {
    const message = [msg.startSysex, 99, msg.endSysex]
    const spy = sinon.spy()
    parser.on('sysex', spy)
    parser.write(message)
    assert.ok(spy.calledWith(99, []), "sysex command emitted")
  })

  it("sysex command during command", () => {
    const message = [msg.startSysex, msg.startSysex, 99, msg.endSysex]
    const spy = sinon.spy()
    parser.on('sysex', spy)
    parser.write(message)
    assert.ok(spy.calledWith(99, []), "sysex command emitted")
  })

  it("midi command", () => {
    const spy = sinon.spy()
    parser.on('midi', spy)
    parser.write(soundOff)
    assert.ok(spy.calledWith(176, 12, [120, 0]), "midi command emitted")
  })

  it("Command during a Sysex Command clears current Sysex", () => {
    const spy = sinon.spy()
    parser.on('midi', spy)
    parser.write([msg.startSysex])
    parser.write(soundOff)
    assert.ok(spy.calledWith(176, 12, [120, 0]), "midi command emitted")
  })

  it("midi System Realtime Commands emit immediately", () => {
    const spy = sinon.spy()
    parser.on('midi', spy)
    parser.write(systemReset)
    assert.ok(spy.calledWith(systemReset[0], null, []), 'realtime command emited')
  })

  it("midi System Realtime Commands emit during sysex", () => {
    const spy = sinon.spy()
    parser.on('midi', spy)
    parser.on('sysex', spy)
    parser.write([msg.startSysex, systemReset[0], 99, msg.endSysex])
    assert.ok(spy.getCall(0).calledWith(systemReset[0], null, []), 'realtime command emited')
    assert.ok(spy.getCall(1).calledWith(99, []), 'sysex command emited')
  })

  it("midi System Realtime Commands emit during midi channel", () => {
    const spy = sinon.spy()
    const mixed = [188, 0xFF, 120, 0]
    parser.on('midi', spy)
    parser.write(mixed)
    assert.ok(spy.getCall(0).calledWith(systemReset[0], null, []), 'realtime command emited')
    assert.ok(spy.getCall(1).calledWith(176, 12, [120, 0]), 'midi command emited')
  })

  it("midi single byte commands", () => {
    const spy = sinon.spy()
    parser.on('midi', spy)
    parser.write([msg.tuneReq]) // [0xF6]
    assert.ok(spy.calledWith(msg.tuneReq, null, []), "Single byte command emitted")
  })

  it("midi channel voice messages", () => {
    const noteOnChan2 = msg.noteOn + 2
    const packet = [noteOnChan2, 0, 0]
    const spy = sinon.spy()
    parser.on('midi', spy)
    parser.write(packet)
    assert.ok(spy.calledWith(msg.noteOn, 2, [0, 0]), "Channel voice message")
  })

  it("midi channel voice messages with 1 data byte", () => {
    const chanPressure2 = msg.chanPressure + 2
    const packet = [chanPressure2, 0]
    const spy = sinon.spy()
    parser.on('midi', spy)
    parser.write(packet)
    assert.ok(spy.calledWith(msg.chanPressure, 2, [0]), "Channel voice message")
  })

  it(".encodeValue", () => {
    const message = Buffer.from([245, 0, 1, 128])
    const encodedMessage = Buffer.from([117, 1, 0, 0, 1, 0, 0, 1])
    assert.deepEqual(Parser.encodeValue(message), encodedMessage)
  })

  it(".encodeString", () => {
    const message = "abc"
    const encodedMessage = Buffer.from([97, 0, 98, 0, 99, 0])
    assert.deepEqual(Parser.encodeString(message), encodedMessage)
  })

  it(".decodeValue", () => {
    const message = Buffer.from([120, 121, 122, 254])
    const encodedMessage = Buffer.from([120, 0, 121, 0, 122, 0, 126, 1])
    assert.deepEqual(Parser.decodeValue(encodedMessage), message)
  })

  it(".decodeString", () => {
    const message = "xyz"
    const encodedMessage = Buffer.from([120, 0, 121, 0, 122, 0])
    assert.deepEqual(Parser.decodeString(encodedMessage), message)
  })
})
