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
const { time } = require('console');
const PORT = new SerialPort('/dev/cu.usbserial-1', {baudRate: 115200});
const parser = PORT.pipe(new ReadLine({delimiter: "\n"}));

app.get('/', function(req,res) {
    res.send('welcome to test interface');
})

app.post('/chat', function(req, res) {
    var data = req.body;
    //test accepting chat event
})

PORT.on('open', () => {
    console.log('serial port open');
})

parser.on("data", (data) => {
    try {
        console.log('read >', data);
        const dataJSON = JSON.parse(data);
        serialHandler(dataJSON);
    } catch (err) {
        console.log('not parseable:', data, err.name, err.message);
    }
})

//function and const for local operating
let MSG_ID = 0;
let SERVER_LIST = {};
let NODE_LIST = [];
let TOPOLOGY = {};
let MTU = 1000;

//variable for flow control
let TO_SEND_BUFF = [];
let SENT_BUFF = []
let RECV_BUFF = {};
let isFree = true;
let timeoutRoutine = null;
let bcastServerRoutine = setInterval(bcastServer,10000);

const handler = {
    'ECHO': function(data) {
        if (data.FROM in SERVER_LIST){
            SERVER_LIST[data.FROM].SERVER_STATUS = 'ONLINE' 
        }
        else {
            SERVER_LIST[data.FROM] = {};
            SERVER_LIST[data.FROM].SERVER_NAME = data.SERVER_NAME;
            SERVER_LIST[data.FROM].SERVER_STATUS = 'ONLINE';
            console.log('added new server', SERVER_LIST);
        }
    },
    'READY': function(data) {
        isFree = true;
        if(!data.SUCCESS){
            recentSend = SENT_BUFF.pop();
            if(recentSend.retires >=1){
                console.log('failed to send', recentSend)
            }
            else {
                TO_SEND_BUFF.push(recentSend);
                sendToSerial();
            }
        }
    },
    'ACK': function(data) {
        for (const [i, msg] of SENT_BUFF.entries()) {
            if (msg.ACK.ACK_MSG_ID == msg.msg.MSG_ID) {
                if (msg.ACK.ACK_FRAG_ID == -1){
                    SENT_BUFF.splice(msg, 1);
                    break;
                }
                else if (msg.ACK.ACK_FRAG_ID == msg.msg.FRAG_ID) {
                    SENT_BUFF.splice(msg, 1);
                    break;
                }
            }
        }
        console.log('ACK', msg.ACK.ACK_MSG_ID, msg.ACK.ACK_FRAG_ID)
    },
    'CHANGED_CONNECTION': function(data) {
        NODE_LIST = data.NODE_LIST;
        TOPOLOGY = data.TOPOLOGY;

        // for (const [i, msg] of SERVER_LIST.entries()) {
        //     if(!NODE_LIST.includes(server.SERVER_ID)) {
        //         SERVER_LIST[i].SERVER_STATUS = 'OFFLINE';
        //     }
        //     else if (server.SERVER_STATUS === 'OFFLINE') {
        //         SERVER_LIST[i].SERVER_STATUS = 'ONLINE'
        //     }
        // }
    }
}

function sendACK(to, ackMsgId, ackFragId) {
    msg = {
        'retires': 0,
        'msg': {
            'MSG_ID': MSG_ID++,
            'FLAG': 'ACK',
            'ACK': {
                'ACK_MSG_ID': ackMsgId,
                'ACK_FRAG_ID': ackFragId
            },
            'TO': to
        }
    }
    //insert as the first priority to response
    if (!TO_SEND_BUFF.length) {
        TO_SEND_BUFF.push(msg)
        sendToSerial();
    }
    else {
        var inserted = false;
        for (const [i, msg] of TO_SEND_BUFF.entries()) {
            if (msg.FLAG === 'ACK') continue;
            else {
                TO_SEND_BUFF.splice(i,0,msg);
                inserted = true;
                break;
            }
        }
        if(!inserted){
            TO_SEND_BUFF.push(msg);
        }
        sendToSerial();
    }
}

function bcastServer(){
    msg = {
        'retires': 0,
        'msg': {
            'MSG_ID': MSG_ID++,
            'FLAG': 'ECHO',
            'SERVER_NAME' : 'SERVER A'
        }
    }
    TO_SEND_BUFF.push(msg);
    sendToSerial();
}

function sendToSerial(){
    if (isFree && TO_SEND_BUFF.length) {
        //there is message waiting to send and the ESP32 is free to send new message
        isFree = false;
        msgToSend = TO_SEND_BUFF.shift();
        console.log('sending', msgToSend)
        PORT.write(JSON.stringify(msgToSend.msg));
        msgToSend.timeSent = Date.now();
        msgToSend.retires = msgToSend.retires + 1;
        SENT_BUFF.push(msgToSend)
        
        //set routine to check if the message was loss
        if (timeoutRoutine == null) {
            timeoutRoutine = setInterval(msgTimeout,1000)
        }
    }
    else if (isFree && !TO_SEND_BUFF){
        //there is nothing to send
        console.log('buffer is empty');
    }
    else if (!isFree){
        console.log('ESP32 is not ready');
    }
}

function msgTimeout(){
    if(!SENT_BUFF) {
        //stop routine for message timeout when sent buffer is empty
        clearInterval(timeoutRoutine);
        timeoutRoutine = null;
    }
}

function serialHandler(data) {
    console.log('received', data)
    var handleSerial = handler[data.FLAG];
    handleSerial(data);
}