//listen to socket.io event from node backend
var io_ListenMsg = require('socket.io').listen("http://172.20.10.4:3000");
io_ListenMsg.on("connection", (socket) => {
    console.log("connected to backend");

    //event from backend to pass data to another esp
    socket.on("passthrough"), (payload) => {
        sendData(payload);
    }
})
//create socket.io server for emitting received message to node backend
var app = require("express")();

//prevent CORS problem
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://172.20.10.4:5000");
  res.header(
    "Access-Control-Allow-Methods",
    "POST, GET, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Option, Authorization"
  );
  next();
});

//use socket.io with express
app.use('/static', express.static('node_modules'));

var http = require("http").Server(app);
var io_Sender = require("socket.io")(http);

http.listen(process.env.PORT || 5000, () => {
    console.log("listening on port %s", process.env.PORT || 5000);
});

//listen to serial port
var SerialPort = require('serialport');
const ReadLine = require('@serialport/parser-readline');
const { serialize } = require('v8');
const { time } = require('console');
const { send } = require('process');
const PORT = new SerialPort('/dev/cu.usbserial-0001', {baudRate: 921600});
const parser = PORT.pipe(new ReadLine({delimiter: "\n"}))

PORT.on('open', () => {
    console.info('serial port open');
});

parser.on('data', (data) => {
    try {
        const dataJSON = JSON.parse(data);
        serialHandler(dataJSON);
    } catch (err) {
        console.error('not parseable', data, err.name, err.message);
    }
});

//const for local operation
let MSG_ID = 0;
let SERVER_LIST = {};
let NODE_LIST = [];
let TOPOLOGY = {};
let MTU = 1000;

//variable for flow control
let TO_SEND_BUFF = [];
let SENT_BUFF = [];
let RECV_BUFF = {};
let isFree = true;
let timeoutRoutine = null;
const TIMEOUT = 10000;

const handler = {
    'ECHO': function(data) {
        if (data.FROM in SERVER_LIST) {
            if (SERVER_LIST[data.FROM].SERVER_STATUS === 'OFFLINE') {
                console.warn('Server', SERVER_LIST[data.FROM].SERVER_NAME, 'back online');
            }
            SERVER_LIST[data.FROM].SERVER_STATUS = 'ONLINE';
        }
        else {
            SERVER_LIST[data.FROM] = {};
            SERVER_LIST[data.FROM].SERVER_NAME = data.SERVER_NAME;
            SERVER_LIST[data.FROM].SERVER_STATUS = 'ONLINE';
            console.log('added new server', SERVER_LIST[data.FROM].SERVER_NAME);
            RECV_BUFF[data.FROM] = {};
        }
    },
    'READY': function(data) {
        isFree = true;
        if(!data.SUCCESS) {
            recentSend = SENT_BUFF.pop();
            if(recentSend.retires >= 3) {
                console.error('ESP failed to send', recentSend.msg.MSG_ID);
            }
            else {
                TO_SEND_BUFF.push(recentSend);
                sendToSerial();
            }
        }
    },
    'ACK': function(data) {
        for (const [i, msg] of SENT_BUFF.entries()) {
            if (data.ACK_FRAG_ID == -1) {
                console.log('ACK', data.MSG_ID, 'RTT', Date.now() - msg.timeSent);
                SENT_BUFF.splice(i, 1);
                break;
            }
            else if (data.ACK_FRAG_ID == msg.msg.FRAG_ID) {
                console.log('ACK', data.MSG_ID, 'FRAG', data.ACK_FRAG_ID, 'RTT', Date.now() - msg.timeSent);
                SENT_BUFF.splice(i, 1);
                break;
            }
        }
    },
    'CHANGED_CONNECTION': function(data) {
        NODE_LIST = data.NODE_LIST;
        TOPOLOGY = data.TOPOLOGY;

        Object.keys(SERVER_LIST).forEach((key, index) => {
            if(!NODE_LIST.includes(key)){
                SERVER_LIST[key].SERVER_STATUS = 'OFFLINE';
            }
        });
        bcastServer();
    },
    'DATA': function(data) {
        if (!data.FRAG) {
            console.log('RECEIVED ', data.MSG_ID);
        }
        else {
            if (data.MSG_ID in RECV_BUFF[data.FROM]) {
                RECV_BUFF[data.FROM][data.MSG_ID].push(data);
                if (RECV_BUFF[data.FROM][data.MSG_ID].length == data.FRAG_LEN) {
                    dataFull = "";
                    for (index = 0; index < data.FRAG_LEN; index++) {
                        for (const [i, frag] of RECV_BUFF[data.FROM][data.MSG_ID].entries()) {
                            if (frag.FRAG_ID == index) {
                                dataFull += frag.DATA;
                                break;
                            }
                        }
                    }
                    console.log('RECEIVED-FRAG', data.MSG_ID);
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

function bcastServer() {
    msg = {
        'retires': 0,
        'msg': {
            'MSG_ID': nextMSG_ID(),
            'FLAG': 'ECHO',
            'SERVER_NAME' : 'SERVER A'
        }
    }
    TO_SEND_BUFF.push(msg);
    sendToSerial();
}

function nextMSG_ID() {
    //a function to prevent MSG_ID to go over MAX_INT
    if (MSG_ID == 1000000) {
        MSG_ID = 0;
        return MSG_ID;
    }
    else {
        return MSG_ID++;
    }
}

function sendToSerial() {
    if (isFree && TO_SEND_BUFF.length) {
        isFree = false;
        msgToSend = TO_SEND_BUFF.shift();
        console.log('sending', msgToSend.msg.FLAG,'ID:',msgToSend.msg.MSG_ID);
        PORT.write(JSON.stringify(msgToSend.msg));
        msgToSend.timeSent = Date.now();
        msgToSend.retires += 1;
        SENT_BUFF.push(msgToSend);

        //set routine to track message timeout
        if (timeoutRoutine == null) {
            timeoutRoutine = setInterval(msgTimeout, 500);
        }
    }
    else if (!isFree) {
        console.log('ESP32 is not ready', TO_SEND_BUFF.length, 'message in queue');
    }
}

function msgTimeout() {
    if (!SENT_BUFF) {
        clearInterval(timeoutRoutine);
        timeoutRoutine = null;
    }
    else {
        for (const [i, msg] of SENT_BUFF.entries()) {
            if (msg.msg.FLAG === 'ECHO') {
                SENT_BUFF.splice(i,1);
            }
            else if (Date.now() - msg.timeSent >= TIMEOUT) {
                currentTime = Date.now()
                var timedoutMsg = msg;
                timedoutMsg.timedout += 1;

                if (timedoutMsg.timedout >= 5) {
                    console.log('TIMEDOUT:', timedoutMsg.msg.MSG_ID, 'discarded this message', (currentTime - msg.timeSent)/1000, 'sec');
                }
                else {
                    console.log('TIMEDOUT:', timedoutMsg.msg.MSG_ID, 'retry sending', (currentTime - msg.timeSent)/1000, 'sec');

                    TO_SEND_BUFF.push(timedoutMsg);
                    SENT_BUFF.splice(i,1);
                    sendToSerial();
                }
            }
        }
    }
}

function sendData(data) {
    dataStr = JSON.stringify(data);

    if (dataStr.length > MTU) {
        //send data in fragment
        dataFrag = chunkSubstr(dataStr, MTU);
        msg = {
            'retires': 0,
            'timedout': 0,
            'msg': {
                'FLAG': 'DATA',
                'FRAG': true,
                'FRAG_LEN': dataFrag.length,
            }
        }
        Object.keys(SERVER_LIST).forEach((key, index) => {
            msg.msg.FRAG_ID = 0;
            msg.msg.TOA, msg.msg.TOB = convertDstAddr(key);
            msg.msg.MSG_ID = nextMSG_ID();

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
                'FLAG': 'DATA',
                'FRAG': false,
                'DATA': dataStr
            }
        }
        Object.keys(SERVER_LIST).forEach((key, index) => {
            msg.msg.TOA, msg.msg.TOB = convertDstAddr(key);
            msg.msg.MSG_ID = nextMSG_ID();
            TO_SEND_BUFF.push(msg);
            sendToSerial();
        });
    }
}

function serialHandler(data) {
    var handleSerial = handler[data.FLAG];
    handleSerial(data);
}

function convertDstAddr(dst) {
    var lenA = dst.length - 5;
    toA = parseInt(dst.slice(0,lenA));
    toB = parseInt(dst.slice(-5));

    return toA, toB
}

function chunkSubstr(str, size) {
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);
  
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size);
    }
  
    return chunks;
}