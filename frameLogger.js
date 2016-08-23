var stream = require('stream');
var util = require('util');
var logger = require('winston');
var fs = require('fs');

var logFrame = function(options, basePath) {
	if(!(this instanceof logFrame)) {
		return new logFrame(options);
	}

	this.name = options.name;
	this.logDelta = options.logDelta;
	this.basePath = basePath;
	this.lastSave = 0;
	this.today = '';
	this.writeStream = undefined;

	if (!options) options = {};
	options.objectMode = true;
	stream.Writable.call(this, options);

	logger.debug('Set up frame logger for camera '+options.name);
}
util.inherits(logFrame, stream.Writable);

logFrame.prototype.getFile = function(timestamp, callback) {
	var dateTime = new Date(timestamp);
	var dateString = dateTime.getFullYear() + '-' + (dateTime.getMonth()+1) + '-' + dateTime.getDate();

	if(dateString == this.today && this.writeStream) {
		callback(this.writeStream);
	} else {
		var filePath = this.basePath + '/' + this.name + '/' + dateString + '.mjpg';

		logger.info('Opening file ' + filePath);

		this.today = dateString;

		var self = this;

		fs.mkdir(this.basePath + '/' + this.name, 0o666, function() {
			self.writeStream = fs.createWriteStream(filePath, { 'flags': 'a' });

			callback(self.writeStream);
		});
	}
}

logFrame.prototype._write = function(chunk, enc, next) {
	if(chunk.time >= (this.lastSave + this.logDelta)) {
		logger.debug('Saving image for '+this.name);

		this.getFile(chunk.time, function(file) {
			file.write(chunk.data);
		});

		this.lastSave = chunk.time;
	}
	next();
}

module.exports = logFrame;