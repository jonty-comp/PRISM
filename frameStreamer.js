var stream = require('stream');
var util = require('util');
var logger = require('winston');

var streamFrame = function(options) {
	if(!(this instanceof streamFrame)) {
		return new streamFrame(options);
	}

	if (!options) options = {};
	options.objectMode = true;
	stream.Transform.call(this, options);
	logger.debug('Set up frame streamer for camera '+options.name);
}
util.inherits(streamFrame, stream.Transform);

streamFrame.prototype._transform = function(chunk, enc, next) {
    if (this._readableState.pipesCount > 0) {
        var httpFrame = Buffer.from('--myboundary\nContent-Type: image/jpeg\nContent-Length: '+ chunk.data.length + '\n\n');
        this.push(httpFrame.concat(chunk.data));
    }
    next();
}

module.exports = streamFrame;