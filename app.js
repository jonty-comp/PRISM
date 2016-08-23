var logger = require('winston');
var express = require('express');
var stream = require('stream');
var mjpegCamera = require('mjpeg-camera');
var processFrame = require('./frameProcessor');
var logFrame = require('./frameLogger');
var config = require('./config');

logger.info('Starting webcam logger / streamer');
logger.level = 'info';

var app = express();
app.listen(config.web_port);

var cameras = config.cameras.map(function(configItem) {
	logger.info('Setting up camera '+configItem.name+' at /'+configItem.name+'.jpg');

	var camera = new mjpegCamera(configItem);
	camera.start();

	logger.debug('Started camera '+configItem.name);

	var frameProcessor = new processFrame(configItem);
	camera.pipe(frameProcessor);

	var frameBroker = new stream.PassThrough({objectMode: true});
	frameProcessor.pipe(frameBroker);

	var frameLogger = new logFrame(configItem, config.logPath);
	frameBroker.pipe(frameLogger);

	app.get('/'+configItem.name+'.jpg', function(req, res) {
		res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=--myboundary');

		var ws = new stream.Writable({objectMode: true});
		ws._write = function(chunk, enc, next) {
			res.write('--myboundary\nContent-Type: image/jpeg\nContent-Length: '+ chunk.data.length + '\n\n');
			res.write(chunk.data);
			next();
		};
		frameBroker.pipe(ws);
		logger.debug('Serving express route /'+configItem.name+'.jpg to '+req.ip);
	});

	return camera;
});
