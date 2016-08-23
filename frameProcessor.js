var stream = require('stream');
var util = require('util');
var logger = require('winston');

var processFrame = function(options) {
	if(!(this instanceof processFrame)) {
		return new processFrame(options);
	}

	this.jpegStart = new Buffer(2);
	this.jpegStart.writeUInt16LE(0xffd8, 0);

	if (!options) options = {};
	options.objectMode = true;
	stream.Transform.call(this, options);
	logger.debug('Set up frame processor for camera '+options.name);
}
util.inherits(processFrame, stream.Transform);

processFrame.prototype._transform = function(chunk, enc, next) {
	if(chunk.data.indexOf(this.jpegStart) === 1) {
		this.push(chunk);
	}
	next();
}

module.exports = processFrame;