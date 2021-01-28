//create web server interface for the web
var http = require('http');
var express = require('express');
const bodyParser = require('body-parser');

var app = express();
app.use(express.json());

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
const PORT = new SerialPort('/dev/cu.usbserial-0001', {baudRate: 921600});
const parser = PORT.pipe(new ReadLine({delimiter: "\n"}));

//function for logging data
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: '10-msg-min_Sender.csv',
  header: [
    {id: 'MSG_ID', title: 'MSG_ID'},
    {id: 'MSG_TYPE', title: 'MSG_TYPE'},
    {id: 'DATA_LEN', title: 'DATA_LEN'},
    {id: 'ERROR', title: 'ERROR'},
    {id: 'timeSentACK', title: 'timeSentACK'},
    {id: 'timeRecvACK', title: 'timeRecvACK'}
  ]
});

app.get('/', function(req,res) {
    res.send('welcome to test interface');
})

app.post('/chat', function(req, res) {
    var data = req.body;
    console.log('frontend received', data)
    res.sendStatus(200);
    //test accepting chat event
    sendData(data)
})

app.post('/longChat', function(req, res) {
    var data = req.body;
    //test accepting chat event
    sendData(data)
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
let timeoutRoutine = setInterval(msgTimeout,500);
let bcastServerRoutine = setInterval(bcastServer,1200000);

const handler = {
    'ECHO': function(data) {
        if (data.FROM in SERVER_LIST){
            if (SERVER_LIST[data.FROM].SERVER_STATUS === 'OFFLINE'){
                console.log('Server', data.FROM, 'back online');
            }
            SERVER_LIST[data.FROM].SERVER_STATUS = 'ONLINE' 
        }
        else {
            SERVER_LIST[data.FROM] = {};
            SERVER_LIST[data.FROM].SERVER_NAME = data.SERVER_NAME;
            SERVER_LIST[data.FROM].SERVER_STATUS = 'ONLINE';
            console.log('added new server', SERVER_LIST);
            RECV_BUFF[data.FROM] = {};
        }
    },
    'READY': function(data) {
        isFree = true;
        if(!data.SUCCESS){
            recentSend = SENT_BUFF.pop();
            if(recentSend.retires >=1){
                console.log('failed to send', recentSend)
                exportCSVLog(recentSend,null,false,true);
            }
            else {
                TO_SEND_BUFF.push(recentSend);
                sendToSerial();
            }
        }
    },
    'ACK': function(data) {
        for (const [i, msg] of SENT_BUFF.entries()) {
            if (data.ACK_MSG_ID == msg.msg.MSG_ID) {
                if (data.ACK_FRAG_ID == -1){
                    SENT_BUFF.splice(i, 1);
                    exportCSVLog(msg,data,false,false);
                    break;
                }
                else if (data.ACK_FRAG_ID == msg.msg.FRAG_ID) {
                    SENT_BUFF.splice(i, 1);
                    break;
                }
            }
        }
        console.log('ACK', data.ACK_MSG_ID,data.ACK_FRAG_ID)
    },
    'CHANGED_CONNECTION': function(data) {
        NODE_LIST = data.NODE_LIST;
        TOPOLOGY = data.TOPOLOGY;

        Object.keys(SERVER_LIST).forEach((key, index) => {
            if(!NODE_LIST.includes(key)){
                SERVER_LIST[key].SERVER_STATUS = 'OFFLINE';
            }
        });
        bcastServer()
    },
    'DATA': function(data) {
        if (!data.FRAG) {
            sendACK(data.FROM, data.MSG_ID, -1);
            console.log('received data', data);
        }
        else {
            sendACK(data.FROM, data.MSG_ID, data.FRAG_ID);
            if (data.MSG_ID in RECV_BUFF[data.FROM]){
                RECV_BUFF[data.FROM][data.MSG_ID].push(data);
                if (RECV_BUFF[data.FROM][data.MSG_ID].length == data.FRAG_LEN) {
                    dataFull = {
                        'MSG_ID': data.MSG_ID,
                        'FLAG': msg.FLAG,
                        'FRAG': msg.FRAG,
                        'FRAG_LEN': msg.FRAG_LEN,
                        'DATA': "",
                    }
                    for (index = 0; index < data.FRAG_LEN; index++){
                        for (const [i, frag] of RECV_BUFF[data.FROM][data.MSG_ID].entries()) {
                            if (frag.FRAG_ID == index) {
                                dataFull.DATA = dataFull.DATA + frag.DATA;
                                break;
                            }
                        }
                    }
                    console.log('received fragmentedData', dataFull);
                    delete RECV_BUFF[data.FROM][data.MSG_ID];
                }
            }
            else {
                RECV_BUFF[data.FROM][data.MSG_ID] = [];
                RECV_BUFF[data.FROM][data.MSG_ID].push(data);
            }
        }
    }
}

function sendACK(to, ackMsgId, ackFragId) {
    msg = {
        'retires': 0,
        'timedout': 0,
        'msg': {
            'MSG_ID': MSG_ID++,
            'FLAG': 'ACK',
            'ACK_MSG_ID': ackMsgId,
            'ACK_FRAG_ID': ackFragId
        }
    }
    var lenA = to.length - 5;
    msg.msg.TOA = parseInt(to.slice(0,lenA));
    msg.msg.TOB = parseInt(to.slice(-5));

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
            timeoutRoutine = setInterval(msgTimeout,500)
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
    else {
        for (const [i, msg] of SENT_BUFF.entries()) {
            console.log(Date.now() - msg.timeSent);
            if (msg.msg.FLAG === 'ECHO'){
                SENT_BUFF.splice(i,1);
            }
            else if (Date.now() - msg.timeSent >= 2000){
                
                var timedoutMsg = msg;
                timedoutMsg.timedout = timedoutMsg.timedout + 1;
                
                exportCSVLog(timedoutMsg,null,true,false);
                if (timedoutMsg.timedout >= 5){
                    console.log('msg', timedoutMsg.msg.MSG_ID ,'timed out and discarded');
                    SENT_BUFF.splice(i,1);
                    //discard timed out message 
                }
                else {
                    console.log('msg', timedoutMsg.msg.MSG_ID ,'timed out and retry sending');
    
                    var inserted = false;
                    for (const [i, msg] of TO_SEND_BUFF.entries()) {
                        if (msg.FLAG === 'ACK') continue;
                        else {
                            TO_SEND_BUFF.splice(i,0,timedoutMsg);
                            SENT_BUFF.splice(i,1);
                            inserted = true;
                            break;
                        }
                    }
                    if(!inserted){
                        TO_SEND_BUFF.push(timedoutMsg);
                        SENT_BUFF.splice(i,1);
                    }
                    sendToSerial();
                } 
            }
        }
    }
    
}

function serialHandler(data) {
    console.log('received', data)
    var handleSerial = handler[data.FLAG];
    handleSerial(data);
}

function sendData(data) {
    dataStr = JSON.stringify(data);
    if (dataStr.length > MTU) {
        //send data in fragment
        dataFrag = chunkSubstr(dataStr)
        msg = {
            'retires': 0,
            'timedout': 0,
            'msg': {
                'MSG_ID': '',
                'FLAG': 'DATA',
                'FRAG': true,
                'FRAG_LEN': dataFrag.length,
                'DATA': ''
            }
        }
        Object.keys(SERVER_LIST).forEach((key, index) => {
            msg.msg.FRAG_ID = 0;
            var lenA = key.length - 5;
            msg.msg.TOA = parseInt(key.slice(0,lenA));
            msg.msg.TOB = parseInt(key.slice(-5));
            msg.msg.MSG_ID = MSG_ID++;

            for (const [i, frag] of dataFrag.entries()) {
                msg.msg.DATA = frag;
                msg.msg.FRAG_ID = msg.msg.FRAG_ID++;

                TO_SEND_BUFF.push(msg);
                sendToSerial();
            }
        });
    }
    else {
        msg = {
            'retires': 0,
            'timedout': 0,
            'msg': {
                'MSG_ID': MSG_ID++,
                'FLAG': 'DATA',
                'FRAG': false,
                'DATA': JSON.stringify(data)
            }
        }
        Object.keys(SERVER_LIST).forEach((key, index) => {
            var lenA = key.length - 5;
            msg.msg.TOA = parseInt(key.slice(0,lenA));
            msg.msg.TOB = parseInt(key.slice(-5));
            msg.msg.MSG_ID = MSG_ID++;
            TO_SEND_BUFF.push(msg);
            sendToSerial();
        });
    }
}

function exportCSVLog(data,ack,isTimedOut,isError){
    if(isTimedOut){
        csvWriter.writeRecords([
            {
                'MSG_ID': data.msg.MSG_ID,
                'DATA_LEN': data.msg.DATA.length,
                'ERROR': 'TIMEDOUT',
            }
        ])
    }
    else if(isError){
        csvWriter.writeRecords([
            {
                'MSG_ID': data.msg.MSG_ID,
                'DATA_LEN': data.msg.DATA.length,
                'ERROR': 'NO ROUTE',
            }
        ])
    }
    else {
        csvWriter.writeRecords([
            {
                'MSG_ID': data.msg.MSG_ID,
                'MSG_TYPE': data.msg.FLAG,
                'DATA_LEN': data.msg.DATA.length,
                'ERROR': 'NONE',
                'timeSentACK': ack.sendTime,
                'timeRecvACK': ack.recvTime
            }
        ])
    }
}