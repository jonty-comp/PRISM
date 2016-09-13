# PRISM
NodeJS capture / logging / streaming server for MJPEG-based IP cameras

## Requirements
- Node v0.6 (if it's simple to fix it up for v0.4, let me know)
- avconv with libx264 support for converting mjpeg videos to mp4
- systemd to use the service script in this file

## Installation
1. Clone the repository
2. Run `npm install` inside the project folder
3. Create a folder to store log items (for instance, `/mnt/cctv`)
4. Copy the `config.js.example` file to `config.js` and edit it to suit your environment
5. Optionally create a systemd configuration for the service
6. Set the cron task to convert mjpeg logs to mp4

## Configuration
`config.js` parameters:

- `config.webPort` - the port your web server will run on.
- `config.logLevel` - the Winston logging level.  Defaults to `info`.
- `config.logPath` - the location on disk to save captured images.
- `config.cameras` - an array containing an object for each camera in the system:
  - `name` - a unique identifier for the camera.  Must not contain spaces or characters that might break your filesystem.
  - `description` - a friendly description for the camera. Presented in the cameras JSON listing.
	- `url` - the URL of the IP camera's MJPEG stream.
	- `user` - the username of the camera.
	- `password` the password of the camera.
	- `sendImmediately` - passed through to Node's request: *`sendImmediately` defaults to `true`, which causes a basic or bearer authentication header to be sent. If `sendImmediately` is `false`, then request will retry with a proper authentication header after receiving a `401` response from the server (which must contain a `WWW-Authenticate` header indicating the required authentication method).*
	- `motion` - whether to only emit frames from the camera when motion is detected.
	- `log` - whether to log this camera or not.
  - `logDelta` - the elapsed time between logging frames.  Because cameras send out frames as fast as they can, and node is event-based, this does not necessarily correlate to a set frames-per-second value.
