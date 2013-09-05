#Midi Parser

[![Build Status](https://travis-ci.org/reconbot/midi-parser.png?branch=master)](https://travis-ci.org/reconbot/midi-parser)

##Why
I needed to decode midi data for [FirmataPi](https://github.com/reconbot/firmata-pi). I learned a lot from [node-firmata](https://github.com/jgautier/firmata), [Essentials of the MIDI protocol](https://ccrma.stanford.edu/~craig/articles/linuxmidi/misc/essenmidi.html) and [Control Systems for Live Entertainment](http://www.amazon.com/Control-Systems-Live-Entertainment-Huntington/dp/0240809378) which is a great book, and this nice little C library [Miby: MIDI Byte-stream Parser](https://code.google.com/p/miby/) based off the MIDI 1.0 spec.

The midi-parser library is a node event emitter. You write midi commands in buffers and it emits `midi` and `sysex` commands as events. We avoid releasing zalgo by always emitting events immediately.

The SysEx commands are unwrapped of their header and footer bytes and provided on the `sysex` event with the command, and data. Since any multibyte data (eg strings) or values over 127 need to be "14 bit encoded". The class methods `decodeString` and `encodeString` are available to assist.

The Midi command are emitted on the `midi` event with command, channel (or null if N/A), and an array of data bytes.

## Feature Completeness
 - Robust error handling (drop anything that doesn't make sense)
 - All standard midi commands are handled
 - All system realtime commands are handled.
 - All Channel Voice Commands are handled.
 - SysEx commands are handled.
 - Running status is currently not implemented.
 - SysEx realtime commands are not handled specially - I'm not clear if they can occur at anytime. If they occur during normal message flow (eg, not in the middle of something else) they'll work fine.

## Contributing
This is public domain work. Feel free to use it, abuse it, complain about performance, bugs, etc. Patches that add core parser or extensibility features are very welcome. The libraries intention is to decode the messages and make them available to another program, not to decode the meanings of these messages for humans. All Patches are welcome with that in mind.
