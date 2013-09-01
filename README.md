firmata-pi
=========

A firmata device implementation for the raspberry pi's gpio. Major parts of this was lifted from [node-firmata](https://github.com/jgautier/firmata).

This is a work in progress.

As for the behavior of the device, I'm copying from the [arduino firmata](https://github.com/firmata/arduino) which is well written but not documented.

The firmata-pi library is a node stream. You write fimrata midi commands and it responds as a device would. Eventually it should include a stream for reading off the gpio's serial port.

This approch will allow it to be substitued as the serial port in other projects such as node-firmata or johnny-five. This will let you run [johny-five](https://github.com/rwldrn/johnny-five) locally on a raspberry pi without the need for an arduino.