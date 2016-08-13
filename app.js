var winston = require('winston');
var express = require('express');
var request = require('request');
var stream = require('stream');
var util = require('util');
var mjpegCamera = require('mjpeg-camera');

var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			handleExceptions: true
		})
	],
	exitOnError: false,
	level: 'debug'
});

logger.debug('starting webcam logger / streamer');

var config = [{
	name: 'Cam1',
	url: 'http://192.168.1.221/mjpeg/stream.cgi?chn=0',
	user: 'admin',
	password: 'password',
	sendImmediately: false,
	motion: false
},{
	name: 'Cam2',
	url: 'http://192.168.1.222/mjpeg/stream.cgi?chn=0',
	user: 'admin',
	password: 'password',
	sendImmediately: false,
	motion: false
}];

var app = express();
app.listen(8080);

function processFrame(options) {
	if(!(this instanceof processFrame)) {
		return new processFrame(options);
	}

	this.jpegStart = new Buffer(2);
	this.jpegStart.writeUInt16LE(0xffd8, 0);

	if (!options) options = {};
	options.objectMode = true;
	stream.Transform.call(this, options);
}
util.inherits(processFrame, stream.Transform);

processFrame.prototype._transform = function(chunk, enc, next) {
	var jpeg = chunk.data;
	if(jpeg.indexOf(this.jpegStart) === 1) {
		this.push(jpeg);
	}
	next();
}

var cameras = config.map(function(configItem) {
	logger.debug('Setting up camera '+configItem.name+' at /'+configItem.name+'.jpg');

	var camera = new mjpegCamera(configItem);
	camera.start();

	logger.debug('Started camera '+configItem.name);

	var frameProcessor = new processFrame();
	camera.pipe(frameProcessor);

	logger.debug('Set up frame processor for camera '+configItem.name);

	app.get('/'+configItem.name+'.jpg', function(req, res) {
		res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=--myboundary');

		var ws = new stream.Writable({objectMode: true});
		ws._write = function(jpeg, enc, next) {
			res.write('--myboundary\nContent-Type: image/jpeg\nContent-Length: '+ jpeg.length + '\n\n');
			res.write(jpeg);
			next();
		};
		frameProcessor.pipe(ws);
		logger.debug('Serving express route /'+configItem.name+'.jpg to '+req.ip);
	});

	return camera;
});