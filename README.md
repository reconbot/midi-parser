#Midi Parser

[![Build Status](https://travis-ci.org/reconbot/midi-parser.png?branch=master)](https://travis-ci.org/reconbot/midi-parser)

This is a work in progress.

I needed to decode midi data for [FirmataPi](https://github.com/reconbot/firmata-pi). I learned a lot from [node-firmata](https://github.com/jgautier/firmata), [Essentials of the MIDI protocol](https://ccrma.stanford.edu/~craig/articles/linuxmidi/misc/essenmidi.html) and [Control Systems for Live Entertainment](http://www.amazon.com/Control-Systems-Live-Entertainment-Huntington/dp/0240809378) which is a great book.

The midi-parser library is a node event emitter. You write midi commands in buffers and it emits both `midi` and `sysex` events.

The sysex events are unwrapped of their header and footer bytes and proveded as is. Since any multibyte data (eg strings) or values over 127 need to be "14 bit encoded". The class methods `decodeString` and `encodeString` are available.

The Midi handling is subject to change. Currently they are emitted as is on the `midi` event. However the difference between channel and system commands and commands without data is still being worked out. Currently as long as data is continuing to be sent, all events will emit. However if you have a 1 byte command as the final command the parser will wait until another command is recieved before emitting that one.

## Parsing Flow

 - keep a buffer of incoming data and process byte by byte
 - if first byte isn't a command byte toss it away
 - if first byte is a start sysex, and last byte is end sysex emit sysex event
 - if first byte is a start sysex wait for more data
 - if we have a command byte and we recieve another, emit all previous data and store the next command byte
 - if we have 3 bytes (max length of a non sysex midi command) emit the midi command
