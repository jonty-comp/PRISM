#!/usr/bin/node

var logger = require('winston');
var express = require('express');
var stream = require('stream');
var mjpegCamera = require('mjpeg-camera');
var glob = require('glob');
var fs = require('fs');

var processFrame = require('./frameProcessor');
var logFrame = require('./frameLogger');
var streamFrame = require('./frameStreamer');
var config = require('./config');

logger.info('Starting webcam logger / streamer');
logger.level = config.logLevel;

var app = express();
app.listen(config.webPort);

var cameras = config.cameras.map(function(configItem) {
	logger.info('Setting up camera '+configItem.name+' at /'+configItem.name+'.jpg');

	var camera = new mjpegCamera(configItem);
	camera.description = configItem.description;
	camera.start();

	logger.debug('Started camera '+configItem.name);

	camera.frameProcessor = new processFrame(configItem);
	camera.pipe(camera.frameProcessor);

	if(configItem.log == true) {
		camera.frameLogger = new logFrame(configItem, config.logPath);
		camera.frameProcessor.pipe(camera.frameLogger);
	}

	camera.frameStreamer = new streamFrame(configItem);
	camera.frameProcessor.pipe(camera.frameStreamer);

	app.get('/'+configItem.name+'.jpg', function(req, res) {
		res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=--myboundary');

		camera.frameStreamer.pipe(res);

		logger.debug('Serving express route /'+configItem.name+'.jpg to '+req.ip);
	});

	return camera;
});

app.get('/cameras', function(req, res) {
	var json = cameras.map(function(camera) {
		return {
			name: camera.name,
			description: camera.description,
			url: '/' + camera.name + '.jpg',
			motion: camera.motion,
			log: (camera.frameLogger !== undefined)
		}
	});

	res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(json, null, 3));
});

app.get('/logs', function(req, res) {
	var json = cameras.filter(function(camera) {
		return camera.frameLogger || false;
	}).map(function(camera) {
		return {
			name: camera.name,
			description: camera.description,
			url: '/' + camera.name + '.jpg',
			motion: camera.motion
		}
	});

	res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(json, null, 3));
});

app.get('/logs/:camera/:logfile?', function(req, res) {
	if(!cameras.some(function(camera) { return (camera.name == req.params.camera); })) {
		res.sendStatus(404);
	} else {
		if(req.params.logfile !== undefined) {
			fs.access(config.logPath+'/'+req.params.camera+'/'+req.params.logfile, fs.F_OK, function(err) {
				if (!err) {
					res.sendFile(config.logPath+'/'+req.params.camera+'/'+req.params.logfile);
				} else {
					res.send(404);
				}
			});
		} else {
			glob(config.logPath+'/'+req.params.camera+'/*.mp4', { nomount: true }, function(er, files) {
				files = files.map(function(file) { return file.replace(config.logPath+'/'+req.params.camera, ''); });
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify(files, null, 3));
			});
		}
	}
});