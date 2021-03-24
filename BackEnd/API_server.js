var app = require("express")();
var config = require("./tester/config_tester");

var schema = require("./db/schema")

const os = require('os');

const bytesToSize = (bytes) => {
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB'];
  if (bytes == 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

 
const CPU_usage = (cpu) => {
  
}  

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", config.host);
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

app.get("/", function (req, res) {
  res.render("/", { tile: "APIxTester" });
});
var http = require("http").Server(app);

var io = require("socket.io")(http);
var mongoose = require("mongoose");
const NodeSchema = schema.Node_schema;

var NodeSchema_list = mongoose.model("NodeSchema_list", NodeSchema);


io.on("connection", (socket) => {
    socket.on("msg", (msg, room, user) => {
        present_room_id = room;
        console.log(`${present_room_id} active!`);
        console.log(`${socket.username} said '${msg}'`);
    
        let message = mongoose.model(present_room_id, chatschema);
        let save_msg = new message({
          username: user,
          msg: msg,
          date: new moment().format("DD/MM/YYYY HH:mm:ss"),
          room: present_room_id,
          FLAG: 'msg',
          owner: "fakeESP32ID",
        });
        socket.join(room, () => {
          save_msg.save((err, result) => {
            if (err) throw err;
            console.log(result);
            console.log("query msg _id: ",result.id)
            msg_room_2.push(result);
            io.to(room).emit("msg_room", result);
    
            // let msgtoSync = result;
            // msgtoSync['FLAG'] = 'msg';
    
            // setTimeout(() => {
            //   sendData(msgtoSync, 'ALL');
            // }, 750);
          });
        });
    })
})

/** ESP32 Zone **/
//listen to serial port
var SerialPort = require("serialport");
const ReadLine = require("@serialport/parser-readline");
const PORT = new SerialPort(config.SERIAL_PORT, { baudRate: config.BUADRATE });
const parser = PORT.pipe(new ReadLine({ delimiter: "\n" }));

PORT.on("open", () => {
  console.info("serial port open");
});

parser.on("data", (data) => {
  try {
    const dataJSON = JSON.parse(data);
    serialHandler(dataJSON);
  } catch (err) {
    console.error("not parseable", data, err.name, err.message);
  }
});

//const for local operation
let MSG_ID = 0;
let ALL_SERVER = {};
let ALL_NODE = {};
let TOPOLOGY = {};
let selfID = "";

initNodeList();

//variable for flow control
let TO_SEND_BUFF = [];
let SENT_BUFF = [];
let RECV_BUFF = {};
let isFree = true;
let timeoutRoutine = null;

const handler = {
  ECHO: function (data) {
    if (data.FROM in ALL_SERVER) {
      if (ALL_SERVER[data.FROM].status === "OFFLINE") {
        console.warn("Server", ALL_SERVER[data.FROM].name, "back online");
      }
      ALL_SERVER[data.FROM].status = "ONLINE";
    } else {
      ALL_SERVER[data.FROM] = {};
      ALL_SERVER[data.FROM].name = data.SERVER_NAME;
      ALL_SERVER[data.FROM].status = "ONLINE";
      console.log("added new server", ALL_SERVER[data.FROM].name);
      RECV_BUFF[data.FROM] = {};

      NodeSchema_list.updateOne(
        { nodeID: data.FROM },
        {
          isServer: true,
          nodeName: data.SERVER_NAME,
        },
        (err, result) => {
          if (err) throw err;
          console.log(result);
        }
      );
    }
  },
  READY: function (data) {

    if (!data.SUCCESS) {
      recentSend = SENT_BUFF.pop();
      console.error("ESP failed to send", recentSend.msg.MSG_ID, "because the node is offline");

      exportCSV_SEND(recentSend, Date.now(),false, true,data.HEAP,bytesToSize(os.freemem()), console.log(os.cpus()));

      ALL_NODE[recentSend.to].status = "OFFLINE";
      ALL_SERVER[recentSend.to].status = "OFFLINE";
      console.log("Server", ALL_SERVER[recentSend.to].name, "went OFFLINE");
      
    } 
    else {
      console.log("ESP is ready to send next");
    }

    if(TO_SEND_BUFF.length){
      sendSerialInterval = null;
      setSerialRoutine();
    } else {
      sendSerialInterval = null;
    }
  },
  ACK: function (data) {
    let ACKREVTIME = Date.now();

    for (const [i, msg] of SENT_BUFF.entries()) {
      if (data.ACK_FRAG_ID == -1 && data.ACK_MSG_ID == msg.msg.MSG_ID) {
        console.log("ACK", data.ACK_MSG_ID, "RTT", ACKREVTIME - msg.timeSent);
        SENT_BUFF.splice(i, 1);
        
        exportCSV_SEND(msg,ACKREVTIME,false,false,data.HEAP,bytesToSize(os.freemem()), console.log(os.cpus()));

        //tag db that this message is sent
        // originalData = JSON.parse(msg.msg.DATA);
        if (msg.FFLAG === "msg") {
          //model for querying db
          var chatModel = mongoose.model("ChatSchemaList", ChatSchema);
          chatModel.updateOne(
            { _id: msg.id },
            {
              $push: {
                synced: msg.to,
              },
            },
            (err, result) => {
              if (err) throw err;
              console.log("updated chat db after synced", result);
            }
          );
        } else if (originalData.FLAG === "room") {
          var roomModel = mongoose.model("RoomSchemaList", RoomSchema);
          roomModel.updateOne(
            { _id: msg.id },
            {
              $push: {
                synced: msg.to,
              },
            },
            (err, result) => {
              if (err) throw err;
              console.log("updated room db after synced", result);
            }
          );
        } else if (originalData.FLAG === "user") {
          var userModel = mongoose.model("UserSchemaList", userRegister);
          userModel.updateOne(
            { _id: msg.id },
            {
              $push: {
                synced: msg.to,
              },
            },
            (err, result) => {
              if (err) throw err;
              console.log("updated user db after synced", result);
            }
          );
        }

        break;
      } else if (data.ACK_FRAG_ID == msg.msg.FRAG_ID && data.ACK_MSG_ID == msg.msg.MSG_ID) {
        console.log("ACK", data.ACK_MSG_ID, "FRAG", data.ACK_FRAG_ID, "RTT", ACKREVTIME - msg.timeSent);
        SENT_BUFF[i].ACKED == true;

        exportCSV_SEND(msg,ACKREVTIME,false,false,data.HEAP,bytesToSize(os.freemem()), console.log(os.cpus()));

        //check if all of the fragmented message was acked
        fragLen = msg.msg.FRAG_LEN;
        ackedCount = 0;
        for (const [j, m] of SENT_BUFF.entries()){
          if (data.ACK_MSG_ID == m.msg.MSG_ID && m.ACKED){
            ackedCount += 1;
          }
          else if (data.ACK_MSG_ID == m.msg.MSG_ID && !m.ACKED){
            break;
          }
        }

        if (ackedCount == msg.msg.FRAG_LEN) {
          for (const [j, m] of SENT_BUFF.entries()){
            if (data.ACK_MSG_ID == m.msg.MSG_ID) {
              SENT_BUFF.splice(j,1);
            }
          }
          console.log('ACKED ALL FRAG',data.ACK_MSG_ID, 'LENGTH', msg.msg.FRAG_LEN)
        }
        // SENT_BUFF.splice(i, 1);
        break;
      }
    }
  },
  CHANGED_CONNECTION: function (data) {
    NODE_LIST = data.NODE_LIST.split(",");
    TOPOLOGY = JSON.parse(data.TOPOLOGY_JSON);
    console.log("TOPOLOGY: ", TOPOLOGY);
    NODE_LIST.splice(NODE_LIST.indexOf(selfID), 1);

    // console.log("ALL_NODE BEFORE", ALL_NODE);
    // console.log("ALL_SERVER BEFORE", ALL_SERVER);

    //update status of the node
    for (var key in ALL_NODE) {
      // console.log("KEY", key, "data in ALL_NODE", ALL_NODE[key]);
      if (NODE_LIST.indexOf(key) >= 0) {
        // console.log("KEY",key,"data in ALL_NODE",ALL_NODE[key],"Key already included");
        if (ALL_NODE[key].status === "OFFLINE") {
          if (key in ALL_SERVER) {
            // console.log("KEY", key, "data in ALL_SERVER", ALL_SERVER[key]);
            ALL_SERVER[key].status = "ONLINE";
            console.log("notice: server", key, ALL_SERVER[key].name, "back online");
            if(TO_SEND_BUFF.length){
              setSerialRoutine();
            }
          } else {
            console.log("notice: node", key, "back online");
          }
        }
        ALL_NODE[key].status = "ONLINE";
        NODE_LIST.splice(NODE_LIST.indexOf(key), 1);
      } else {
        if (ALL_NODE[key].status === "ONLINE") {
          if (key in ALL_SERVER) {
            ALL_SERVER[key].status = "OFFLINE";
            console.log("notice: server", key, ALL_SERVER[key].name, "went offline");
            
          } else {
            console.log("notice: node", key, "went offline");
          }
        }
        ALL_NODE[key].status = "OFFLINE";
      }
    }

    // console.log("ALL_NODE new Status", ALL_NODE);
    // console.log("ALL_SERVER new Status", ALL_SERVER);

    //add new node to database
    NODE_LIST.forEach((item, index) => {
      console.log("NEW NODE", item, "index", index, 'ONLINE');
      ALL_NODE[item] = {
        status: "ONLINE",
      };
      let new_node = new NodeSchema_list({
        nodeID: item,
        isServer: false,
        nodeName: "",
      });
      new_node.save((err, result) => {
        if (err) throw err;
        console.log(result);
      });

      echoServer(item);
    });

    // console.log("ALL_NODE AFTER", ALL_NODE);
    // console.log("ALL_SERVER AFTER", ALL_SERVER);
    // bcastServer();
  },
  DATA: function (data) {
    exportCSV_RECV(data, Date.now());
    if (!data.FRAG) {
      console.log("RECEIVED ", data.MSG_ID, "ESP HEAP: ", data.HEAP);
      // console.log("msg is: ", data.DATA);
      // console.log("send msg to: ", present_room_id);
      var extract_json_obj = JSON.parse(data.DATA);
      // console.log(extract_json_obj)
      if (extract_json_obj.FLAG === "msg") {
        let message = mongoose.model(present_room_id, ChatSchema);
        let u_name_in_chat = extract_json_obj.username;
        let msg_in_chat = extract_json_obj.msg;
        let date_in_chat = extract_json_obj.date;
        let room_in_chat = extract_json_obj.room;
        if (room_in_chat !== present_room_id) {
          console.log("mismatch room");
          console.log(`user is: ${u_name_in_chat} msg is: ${msg_in_chat}
          date is: ${date_in_chat} room is: ${room_in_chat} `);
          let message = mongoose.model(room_in_chat, ChatSchema);
          let save_msg = new message({
            username: u_name_in_chat,
            msg: msg_in_chat,
            date: date_in_chat,
          });
          save_msg.save((err, result) => {
            if (err) throw err;
            // console.log(result);
            msg_room_2.push(result);
            io.to(room_in_chat).emit("msg_room", result);
          });
        } else {
          let save_msg = new message({
            username: u_name_in_chat,
            msg: msg_in_chat,
            date: date_in_chat,
          });
          save_msg.save((err, result) => {
            if (err) throw err;
            // console.log(result);
            msg_room_2.push(result);
            io.to(present_room_id).emit("msg_room", result);
          });
        }
      }
    } else {
      if (data.MSG_ID in RECV_BUFF[data.FROM]) {
        RECV_BUFF[data.FROM][data.MSG_ID].push(data);
        if (RECV_BUFF[data.FROM][data.MSG_ID].length == data.FRAG_LEN) {
          dataFull = "";
          for (index = 0; index < data.FRAG_LEN; index++) {
            for (const [i, frag] of RECV_BUFF[data.FROM][
              data.MSG_ID
            ].entries()) {
              if (frag.FRAG_ID == index) {
                dataFull += frag.DATA;
                break;
              }
            }
          }
          console.log("RECEIVED-FRAG", data.MSG_ID);
          delete RECV_BUFF[data.FROM][data.MSG_ID];
        }
      } else {
        RECV_BUFF[data.FROM][data.MSG_ID] = [];
        RECV_BUFF[data.FROM][data.MSG_ID].push(data);
      }
    }
  },
  INIT: function (data) {
    console.log(data);
    selfID = data.NODE_ID;
    console.log("INIT SELF ID", selfID);
  }
};

let sendSerialInterval = null

function setSerialRoutine() {
  if (sendSerialInterval == null){
    sendSerialInterval = setTimeout(sendToSerial, (Math.random() * 500) + 150)
  }
}

function echoServer(dest) {
  msg = {
    msg: {
      MSG_ID: nextMSG_ID(),
      FLAG: "ECHO",
      SERVER_NAME: "SERVER A",
      TOA: convertDstAddr(dest)[0],
      TOB: convertDstAddr(dest)[1],
    },
  };
  TO_SEND_BUFF.push(msg);
  setSerialRoutine();
}

function nextMSG_ID() {
  //a function to prevent MSG_ID to go over MAX_INT
  if (MSG_ID == 1000000) {
    MSG_ID = 0;
    return MSG_ID;
  } else {
    return MSG_ID++;
  }
}

function sendToSerial() {
  let msgToSend = null
  if (TO_SEND_BUFF.length) {
    let shiftCount = 0
    while (true) {
      shiftCount += 1;
      let selectedMsg = JSON.parse(JSON.stringify(TO_SEND_BUFF[0]))
      
      try {
        if (selectedMsg.msg.FLAG == 'ECHO'){
          msgToSend = selectedMsg;
          TO_SEND_BUFF.splice(0,1);
          break;
        }
        else if (ALL_SERVER[selectedMsg.to].status === "ONLINE") {
          msgToSend = selectedMsg;
          TO_SEND_BUFF.splice(0,1);
          break;
        }
        else {
          TO_SEND_BUFF.push(selectedMsg);
          TO_SEND_BUFF.splice(0,1);
          if (shiftCount == TO_SEND_BUFF.length) {
            break;
          }
        }
      } catch (err){
        console.log(`err ${err} \n, ${selectedMsg},to send buff len ${TO_SEND_BUFF.length}`)
        console.log('to send bugg', TO_SEND_BUFF)
        console.log('AllServer', ALL_SERVER)
        break
      }
    }
    // msgToSend = TO_SEND_BUFF.shift();
    if (msgToSend != null){
      console.log("\t sending", msgToSend.msg.FLAG, "ID:", msgToSend.msg.MSG_ID);
      // console.log(msgToSend);
      PORT.write(JSON.stringify(msgToSend.msg));
      msgToSend.timeSent = Date.now();
      SENT_BUFF.push(msgToSend);

      //set routine to track message timeout
      if (timeoutRoutine == null) {
        timeoutRoutine = setInterval(msgTimeout, 500);
      }
    }
    else {
      console.log("nothing to send all server is offline", TO_SEND_BUFF.length, 'msg in queue');
      sendSerialInterval = null;
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
    for (const [i, msg] of SENT_BUFF.entries()) {
      if (msg.msg.FLAG === "ECHO") {
        SENT_BUFF.splice(i, 1);
      } else if (Date.now() - msg.timeSent >= config.TIMEOUT) {
        currentTime = Date.now();
        var timedoutMsg = msg;

        exportCSV_SEND(timedoutMsg,Date.now(),true, false,null,bytesToSize(os.freemem()));

        timedoutMsg.timedout += 1;

        if (timedoutMsg.timedout >= 5) {
          console.log("TIMEDOUT:",timedoutMsg.msg.MSG_ID,"discarded this message at",(currentTime - msg.timeSent) / 1000,"sec");
        } else {
          console.log("TIMEDOUT:",timedoutMsg.msg.MSG_ID,"will retry sending",(currentTime - msg.timeSent) / 1000,"sec");
          TO_SEND_BUFF.push(timedoutMsg);
          SENT_BUFF.splice(i, 1);
          setSerialRoutine();
        }
      }
    }
  }
}

function sendFragment(dataStr, dest, _id, FLAG) {
  dataFrag = chunkSubstr(dataStr, config.MTU);

  msg = {
    timedout: 0,
    to: dest,
    id: _id,
    FFLAG: FLAG,
    ACKED: false,
    msg: {
      MSG_ID: nextMSG_ID(),
      FLAG: "DATA",
      FRAG: true,
      FRAG_ID: 0,
      FRAG_LEN: dataFrag.length,
      TOA: convertDstAddr(dest)[0],
      TOB: convertDstAddr(dest)[1],
    },
  };

  for (const [i, frag] of dataFrag.entries()) {
    msg.msg.DATA = frag;
    msg.msg.FRAG_ID = msg.msg.FRAG_ID++;

    TO_SEND_BUFF.push(msg);
    setSerialRoutine();
  }
}

function sendSingle(dataStr, dest, _id, FLAG) {
  msg = {
    timedout: 0,
    to: dest,
    id: _id,
    FFLAG: FLAG,
    msg: {
      MSG_ID: nextMSG_ID(),
      FLAG: "DATA",
      FRAG: false,
      DATA: dataStr,
      TOA: convertDstAddr(dest)[0],
      TOB: convertDstAddr(dest)[1],
    },
  };
  // console.log("sending to serial", msg);
  TO_SEND_BUFF.push(msg);
  setSerialRoutine();
}

function sendData(data, dest, _id) {
  dataStr = JSON.stringify(data);
  // console.log("send", data, "to ", dest, "len", dataStr.length);
  if (dataStr.length > config.MTU) {
    //send data in fragment
    if (dest === "ALL") {
      for (var server in ALL_SERVER) {
        if (ALL_SERVER[server].status === "ONLINE") {
          console.log("will send to", server);
          sendFragment(dataStr, server, _id, data.FLAG);
        }
      }
    } else {
      sendFragment(dataStr, dest, _id, data.FLAG);
    }
  } else {
    if (dest === "ALL") {
      for (var server in ALL_SERVER) {
        if (ALL_SERVER[server].status === "ONLINE") {
          console.log("will send to", server, ALL_SERVER[server]);
          sendSingle(dataStr, server, _id, data.FLAG);
        }
      }
    } else {
      sendSingle(dataStr, dest, _id, data.FLAG);
    }
  }
}

function serialHandler(data) {
  var handleSerial = handler[data.FLAG];
  handleSerial(data);
}

function convertDstAddr(dst) {
  // console.log(typeof dst);
  var lenA = dst.length - 5;
  toA = parseInt(dst.slice(0, lenA));
  toB = parseInt(dst.slice(-5));

  return [toA, toB];
}

function chunkSubstr(str, size) {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }

  return chunks;
}

function initNodeList() {
  NodeSchema_list.find({}, { nodeID: 1, _id: 0 }, (err, result) => {
    console.log("data from node schema", result);
    if (err) throw err;
    var NODE_LIST = [];
    result
      .map(({ nodeID }) => nodeID)
      .forEach((element) => {
        NODE_LIST.push(element);
      });

    NODE_LIST.forEach((key) => {
      console.log(key);
      ALL_NODE[key] = {
        status: "OFFLINE",
      };
    });

    console.log("NODE LIST", NODE_LIST);
    console.log("ALL NODE", ALL_NODE);
  });

  NodeSchema_list.find({ isServer: true }, (err, result) => {
    if (err) throw err;
    SERVER_LIST = result;
    console.log("Server lists: ", SERVER_LIST);
    for (var server in SERVER_LIST) {
      console.log(server);
      ALL_SERVER[SERVER_LIST[server].nodeID] = {
        status: "OFFLINE",
        name: SERVER_LIST[server].nodeName,
      };
    }
    console.log("SERVER LIST", SERVER_LIST);
    console.log("ALL SERVER", ALL_SERVER);
  });
}


  //  console.log('free memory : ', bytesToSize(os.freemem()));
  //  console.log('total memory : ', bytesToSize(os.totalmem()));

function exportCSV_RECV(data, recvTime){
  csvWriter_RECV.writeRecords([
      {
          'MSG_ID': data.MSG_ID,
          'FRAG_ID': data.FRAG_ID,
          'DATA_LEN': data.DATA.length,
          'timeRecv': recvTime,
          'HEAP': data.HEAP,
          'Free_Mem': bytesToSize(os.freemem())
      }
  ])
}

function exportCSV_SEND(data,currentTime,isTimedOut,isError,HEAP,FREE,CPU){
  if(isTimedOut){
      csvWriter_SEND.writeRecords([
          {
              'MSG_ID': data.msg.MSG_ID,
              'FRAG_ID': data.msg.FRAG_ID,
              'DATA_LEN': data.msg.DATA.length,
              'ERROR': 'TIMEDOUT',
              'retires': data.retires,
              'timeSend': data.timeSent,
              'timeAckRecv': currentTime,
              'HEAP':'-',
              'Free_Mem':FREE,
              'CPU LOAD': CPU
          }
      ])
  }
  else if(isError){
      csvWriter_SEND.writeRecords([
          {
              'MSG_ID': data.msg.MSG_ID,
              'FRAG_ID': data.msg.FRAG_ID,
              'DATA_LEN': data.msg.DATA.length,
              'ERROR': 'ESP32',
              'retires': data.retires,
              'timeSend': data.timeSent,
              'timeAckRecv': "-",
              'HEAP':HEAP,
              'Free_Mem':bytesToSize(os.freemem()),
              'CPU_LOAD': console.log(os.cpus()),
          }
      ])
  }
  else {
      csvWriter_SEND.writeRecords([
          {
              'MSG_ID': data.msg.MSG_ID,
              'FRAG_ID': data.msg.FRAG_ID,
              'MSG_TYPE': data.msg.FLAG,
              'DATA_LEN': data.msg.DATA.length,
              'ERROR': 'NONE',
              'retires': data.retires,
              'timeSend': data.timeSent,
              'timeAckRecv': currentTime,
              'HEAP':HEAP,
              'Free_Mem':bytesToSize(os.freemem()),
              'CPU_LOAD':console.log(os.cpus()),
          }
      ])
  }
}

//http api for sending test messages
app.get('/', function(req,res) {
  res.send('welcome to test interface');
})

app.post('/chat', function(req, res) {
  var data = req.body;
  res.sendStatus(200);
  sendData(data)
})

app.post('/longChat', function(req, res) {
  var data = req.body;
  res.sendStatus(200);
  sendData(data)
  
})

//function for logging data
const createCSVWriter_SEND = require('csv-writer').createObjectCsvWriter;
const csvWriter_SEND = createCSVWriter_SEND({
path: '10-MM_SEND_SERVERB.csv',
header: [
  {id: 'MSG_ID', title: 'MSG_ID'},
  {id: 'FRAG_ID', title: 'FRAG_ID'},
  {id: 'MSG_TYPE', title: 'MSG_TYPE'},
  {id: 'DATA_LEN', title: 'DATA_LEN'},
  {id: 'ERROR', title: 'ERROR'},
  {id: 'retires', title: 'retires'},
  {id: 'timeAckRecv', title: 'timeAckRecv'},
  {id: 'timeSend', title: 'timeSend'},
  {id: 'HEAP', title:'HEAP'},
  {id: 'Free_Mem',title:'Free_Mem'},
  {id: "CPU_LOAD", title: 'CPU_LOAD' }
]
});

const createCSVWriter_RECV = require('csv-writer').createObjectCsvWriter;
const csvWriter_RECV = createCSVWriter_RECV({
path: '10-MM_RECV_SERVERB.csv',
header: [
  {id: 'MSG_ID', title: 'MSG_ID'},
  {id: 'FRAG_ID', title: 'FRAG_ID'},
  {id: 'DATA_LEN', title: 'DATA_LEN'},
  {id: 'timeRecv', title: 'timeRecv'},
  {id: 'HEAP', title:'HEAP'},
  {id: 'Free_Mem',titile:'Free_Mem'},
  {id: "CPU_LOAD", title: 'CPU_LOAD' }
]
});



http.listen(process.env.PORT || config.port, () => {
    console.log("Listening on port %s", process.env.PORT || config.port);
  });