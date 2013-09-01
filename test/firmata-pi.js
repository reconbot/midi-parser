var FirmataPi = require('../firmata-pi');
var Parser = require('../midi-parser');

module.exports['Report Versions On Startup'] = function (test) {
  var board = new FirmataPi();
  var parser = new Parser();

  var firmataVersion;
  var firmwareVersion;
  var calls = 0;

  parser.once('midi', function (data) {
    firmataVersion = data;
    calls += 1;
    test.equal(calls, 1, 'Firmata reported first');
  });

  parser.once('sysex', function (data) {
    firmwareVersion = data;
    calls += 1;
    test.equal(calls, 2, 'Firmware reported second');
  });

  parser.write(board.read());

  test.equal(firmataVersion[0], 249, 'Firmata Version CMD');
  test.equal(firmataVersion[1], 2, 'Firmata Version Major');
  test.equal(firmataVersion[2], 3, 'Firmata Version Minor');

  test.equal(firmwareVersion[0], 121, 'Firmware Version SYSEX CMD');
  test.equal(firmwareVersion[1], 0, 'Firmware Version Major');
  test.equal(firmwareVersion[2], 1, 'Firmware Version Minor');

  var name = Parser.decodeString(firmwareVersion, 3);
  test.equal(name, "FirmataPi", "Firmware Name");

  test.done();
};