var SerialPort = require("serialport");
const ReadLine = require("@serialport/parser-readline");
const PORT = new SerialPort('/dev/cu.usbserial-0001', { baudRate: 921600 });
const parser = PORT.pipe(new ReadLine({ delimiter: "\n" }));

PORT.on("open", () => {
  console.info("serial port open");
});

parser.on("data", (data) => {
  try {
    const dataJSON = JSON.parse(data);
    serialHandler(dataJSON, data.length);
  } catch (err) {
    if (data.search("CONNECTION") != -1) {
      console.log(data)
    }
    else {
      console.error("not parseable", data, err.name, err.message);
    } 
  }
});

let SERIAL_ONLINE = false
let RTS = false
let BURST = 2
let BURSTLT = BURST

let MSG_ID = 0
let SELF_ID = "3047299793"

let TO_SEND_BUFF = []
let SENT_BUFF = []

let NODE_LIST = []
let TOPOLOGY = {}
let TESTDST = "3047322725"
let TESTDST_STAT = "OFFLINE"

let sendSerialInterval = null;
let timeoutRoutine = null;

let T_ST = null;

function generateMessage(amount, physlen){
  for (i of range(0,amount -1)){
    MSG_DATA = {
      T_SEND: 0,
      ER_COUNT: 0,
      DST: TESTDST,
      PHYS_LEN: 0,
      msg: {
        F: 4,
        H: {
            ID: nextMSG_ID(),
            FID: -1,
            FL: -1,
            AG: 9,
            DA: 30473,
            DB: 22725
        },
        D:[genData(1320)]
      }
    }
    MSG_DATA.PHYS_LEN = JSON.stringify(MSG_DATA.msg).length

    console.log("generated MSG_DATA PHYS LEN:", MSG_DATA.PHYS_LEN)
    TO_SEND_BUFF.push(MSG_DATA)
  }
}

function INIT(F_INIT) {

  if (SELF_ID != F_INIT.D){
      console.log("INIT SELF_ID", F_INIT.D)
      SELF_ID = F_INIT.D
  }
  else {
    console.log("already initialized")
  }
  if (!SERIAL_ONLINE){
    SERIAL_ONLINE = true;
    var amount = 20
    var physlen = 400
    generateMessage(amount, physlen)
    RTS = true
    wait(5000)
    T_ST = Date.now()
    setSerialRoutine();
  }
  
}

function READY(f_ready) {
  if (f_ready.D == 0) {
    recentSend = SENT_BUFF.pop()
    console.error("NO ROUTE for MSG", recentSend.msg.H.ID, "TO", recentSend.DST)
    TESTDST_STAT = "OFFLINE"
    TO_SEND_BUFF.push(recentSend)
  } else {
    console.log((Date.now() - T_ST) / 1000, "ESP is ready")
  }

  if (TO_SEND_BUFF.length) {
    sendSerialInterval = null;
    setSerialRoutine();
  } else {
    sendSerialInterval = null;
    BURSTLT = BURST;
  }
}

function ACK(f_ack) {
  let ACKREVTIME = Date.now();
  found = false;
  for (let [i, msg] of SENT_BUFF.entries()) {
    if (f_ack.H.ID == msg.msg.H.ID && f_ack.H.FID == -1){
      console.log((Date.now() - T_ST) / 1000, "ACK", f_ack.H, "RTT", ACKREVTIME - msg.T_SEND)
      SENT_BUFF.splice(i,1);
      found = true;
      break;
    }
  }
  if(!found){
    console.log("ACK DELAYED", f_ack.H.ID);
  }
}

function CHANGE(f_change) {
  NODE_LIST = f_change.D.NL.split(",");
  NODE_LIST.splice(NODE_LIST.indexOf(SELF_ID), 1);
  TOPOLOGY = JSON.parse(f_change.D.TP);

  if (NODE_LIST.indexOf(TESTDST) >= 0){
    TESTDST_STAT = "ONLINE"
    console.log("SERVER B ONLINE")
    if (TO_SEND_BUFF.length) {
      sendSerialInterval = null;
      setSerialRoutine();
    }
  }
  else {
    TESTDST_STAT = "OFFLINE"
    console.log("SERVER B OFFLINE")
  }

  console.log("FINAL RESULT", NODE_LIST, TOPOLOGY)
}

function nextMSG_ID() {
  //a function to prevent MSG_ID to go over MAX_INT
  if (MSG_ID == 999) {
    MSG_ID = 0;
    return MSG_ID;
  } else {
    return MSG_ID++;
  }
}

function serialHandler(data){
  // console.log("incoming data:", data, PHYS_LEN)
  switch(data.F){
    case 0: INIT(data); break;
    case 1: READY(data); break;
    case 2: CHANGE(data); break;
    case 5: ACK(data); break; 
  }
}

function calcDataLen(data) {
  length = 0
  for (i in data){
      length += data[i].length
  }
  return length
}

function calcPhysLen(data){
  var len = JSON.parse(data).length
  var appendLen = len.toString().length
  if (len >= 98 && len < 100) {
    appendLen += 1
  }
  else if (len >= 997 && len < 1000) {
    appendLen += 1
  }
  return len + appendLen
}

function calcHop(node, tp) {

  if (node === String(tp.nodeId)){
    return 0
  }
  else if ("subs" in tp) {
    for (i in tp.subs) {
      var dfs = calcHop(node, tp.subs[i]);
      if (dfs != -1) {
          return 1 + dfs
      }
    }
    return -1
  } else {
    return -1
  }
}

function wait(ms){
  var start = new Date().getTime();
  var end = start;
  while(end < start + ms) {
      end = new Date().getTime();
  }
}

function genData(length) {
  var result           = [];
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
 }
 return result.join('');
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => i)
}

function setSerialRoutine() {
  if (sendSerialInterval == null) {
    if(BURSTLT == 0){
      BURSTLT = BURST
      sendSerialInterval = setTimeout(sendToSerial, Math.random() * 500 + 50);
    }
    else {
      sendSerialInterval = setTimeout(sendToSerial, Math.random() * 5);
      BURSTLT -= 1;
    }
  }
}

function sendToSerial() {
  if (TO_SEND_BUFF.length) {
    if (TESTDST_STAT == "ONLINE"){
      let msgToSend = TO_SEND_BUFF.shift()
      console.log((Date.now() - T_ST) / 1000, "sending", msgToSend.msg.H.ID)
      // console.log("printing", JSON.stringify(msgToSend.msg))

      PORT.write(JSON.stringify(msgToSend.msg));
      msgToSend.T_SEND = Date.now();
      SENT_BUFF.push(msgToSend);

      if (timeoutRoutine == null) {
        timeoutRoutine = setInterval(msgTimeout, 500);
      }
    } else {
      console.log("nothing to send all server is offline",TO_SEND_BUFF.length,"msg in queue");
      sendSerialInterval = null;
      BURSTLT = BURST;
    }
    
  } else if (TO_SEND_BUFF.length) {
    console.log("ESP32 is not ready", TO_SEND_BUFF.length, "message in queue");
  }
}

function msgTimeout() {
  if (!SENT_BUFF) {
    clearInterval(timeoutRoutine);
    timeoutRoutine = null;
  } else {
    toSplice = []

    for (let [i, msg] of SENT_BUFF.entries()) {
      if (msg.msg.F == 3) {
        toSplice.push(i)
      } else if (Date.now() - msg.T_SEND >= 10000) {
        currentTime = Date.now();
        var timedoutMsg = msg;

        timedoutMsg.ER_COUNT += 1;

        console.log((Date.now() - T_ST) / 1000, "TIMEDOUT:",timedoutMsg.msg.H.ID,"TIME OUT AT",(currentTime - msg.T_SEND) / 1000,"sec");
        TO_SEND_BUFF.push(timedoutMsg);
        toSplice.push(i)
        setSerialRoutine();
      }
    }

    toSplice.forEach((item, index) => {
      SENT_BUFF.splice(item,1)
    })
  }
}