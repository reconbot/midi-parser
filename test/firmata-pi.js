var FirmataPi = require('../firmata-pi');
var Parser = require('../midi-parser');
var sinon = require('sinon');

module.exports['Report Versions On Startup'] = function (test) {
  var firmata = sinon.spy(FirmataPi.prototype, 'emitFirmataVersion');
  var firmware = sinon.spy(FirmataPi.prototype, 'emitFirmwareVersion');

  var board = new FirmataPi();

  test.ok(firmata.calledOnce);
  test.ok(firmware.calledOnce);

  firmata.restore();
  firmware.restore();
  test.done();
};

module.exports['emitFirmataVersion'] = function (test) {
  var board = new FirmataPi();
  board.read(); // clear the read queue
  test.equal(board.read(), null); // ensure it's clear

  board.emitFirmataVersion();
  var version = board.read();
  test.deepEqual(version, Buffer([249, 2, 3]), 'Firmata Version 0.1');
  test.done();
};

module.exports['emitFirmwareVersion'] = function (test) {
  var board = new FirmataPi();
  board.read(); // clear the read queue
  test.equal(board.read(), null); // ensure it's clear

  board.emitFirmwareVersion();
  var version = board.read();

  // ignore the first byte sysex start
  test.deepEqual(version.slice(1, 4), Buffer([121, 0, 1]), 'Firmware Version 0.1');

  // ignore the last byte sysex end
  var name = Parser.decodeString(version.slice(4, -1));
  test.equal(name, "FirmataPi", "Firmware Name");
  test.done();
};