//create web server interface for the web
var http = require('http');
var express = require('express');
var app = express();

var server = http.createServer(app);
server.listen(5000);

//listen to socketio event
// var io = require('socket.io').listen(server);

// app.use('/static', express.static('node_modules'));

//handle io event
// io.on('connection', function (socket) {
//     console.log('connected to socket')
// })

//listen to serial port
var SerialPort = require('serialport');
const ReadLine = require('@serialport/parser-readline');
const { TIMEOUT } = require('dns');
const { connect } = require('http2');
const PORT = new SerialPort('/dev/cu.usbserial-0001', {baudRate: 115200});
const parser = port.pipe(new ReadLine({delimiter: "\n"}));

app.get('/', function(req,res) {
    res.send('welcome to test interface');
})

app.post('/chat', function(req, res) {
    var data = req.body;
    //test accepting chat event
})

port.on('open', () => {
    console.log('serial port open');
})

parser.on("data", (data) => {
    try {
        const dataJSON = JSON.parse(data);
    } catch (err) {
        console.log('not parseable:', data);
    }
})