var app = require("express")();
var config = require("./config");
var schema = require("./db/schema");
const moment = require("moment");
const { error } = require("console");
var mongoose = require("mongoose");
const cors = require('cors')

app.use(cors())

app.get("/", function (req, res) {
  res.render("/", { tile: "PrivaChat V1.1" });
});

var http = require("http").Server(app);
var io = require("socket.io")(http);
let users = [];
let msg_room_2 = [];
var room_lists = [];
var lists = [];
var present_room_id = "";

moment.locale("th");

const bytesToSize = (bytes) => {
  const sizes = ["Bytes", "KiB", "MiB", "GiB"];
  // if (bytes == 0) return "0 Byte";
  // const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  // return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
  return bytes/1000
};

const cpu_usage = (data) => {
	if (data == 0) return "0";
	return data.toFixed(2)
	// return console.log(`${os.loadavg()[1].toFixed(2)} %`);
}

mongoose.connect(config.db, {
  auth: {
    authSource: config.username_mongoDB,
  },
  user: config.username_mongoDB,
  pass: config.password_mongoDB,
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

mongoose.connection.on("error", (err) => {
  console.log(err);
});

mongoose.connection.on("connected", (err, res) => {
  if (err) throw err;
  console.log("mongoose is connected");
});

var ChatSchema = schema.chat_schema;

var RoomSchema = schema.Room_schema;

var room_list = mongoose.model("room_list", RoomSchema);

const NodeSchema = schema.Node_schema;

var NodeSchema_list = mongoose.model("NodeSchema_list", NodeSchema);

room_list.find({}, { RoomID: 1, _id: 0 }, (err, result) => {
  result
    .map(({ RoomID }) => RoomID)
    .forEach((element) => {
      lists.push(element);
    });
  room_lists = result;
});

const userRegister = schema.user_register;

var userDataModel = mongoose.model("user_register", userRegister);
userDataModel.find((err, result) => {
  if (err) throw err;
  nameinchat = result;
});

io.on("connection", (socket) => {
  socket.emit("passthrough", "asd");
  if (present_room_id) {
    console.log("connecting to:", present_room_id);
  }
  socket.emit("loggedIn", {
    users: users.map((s) => s.username),
    messages: msg_room_2,
    room: present_room_id,
  });

  socket.emit("list_rooms", room_lists);

  socket.on("newuser", (username) => {
    console.log(`${username} has join at the chat.`);

    socket.username = username;
    if (socket) {
      users.push(socket);
    }

    if (socket.username !== "undefined") {
      io.emit("userOnline", socket.username);
    }
  });

  socket.on("user_regis", (userdata, userpassword) => {
    let Data = new userDataModel({
      registername: userdata,
      password: userpassword,
    });
    console.log(
      `Username is ${Data.registername} Password is ${Data.password}`
    );
    console.log(`Register Sucessfully!`);
    Data.save((err, result) => {
      if (err) throw err;
      io.emit("regis_success", "Register Success!");
    });
  });

  socket.on("user_create_room", (data) => {
    console.log(data);
    room_list.find(
      {
        RoomID: data,
      },
      (err, result) => {
        if (err) throw err;
        console.log(result);
        if (result.length === 0) {
          console.log(`This room name ${data} is not created`);
          let new_room = mongoose.model(data, ChatSchema);
          let data_room = new new_room({
            username: "Admin",
            msg: `Welcome to ${data}`,
            date: new moment().format("DD/MM/YYYY HH:mm:ss"),
          });
          let room = new room_list({
            RoomID: data,
          });
          room.save(data);
          data_room.save((err, result) => {
            if (err) throw err;
            console.log(result);
            socket.emit("create_success", "Create Room Successfully!");
          });
        } else {
          console.log(`This room name ${data} already created`);
          socket.emit("unable_to_create", {
            msg: "Room is existed",
            room_existed: data,
          });
        }
      }
    );
  });

  socket.on("get_room_list", (payload) => {
    console.log(payload);
    room_list.find((err, result) => {
      if (err) throw err;
      socket.emit("room_lists_result", result);
    });
  });

  socket.on("user_auth", (user_payload, password_payload, room) => {
    present_room_id = room;
    console.log("User join to ", room);

    userDataModel.find(
      {
        registername: user_payload,
        password: password_payload,
      },
      (err, result) => {
        if (err) throw err;
        if (result.length === 0) {
          console.log("Data not found");
          socket.emit("auth_fail", "Username or Password is wrong");
        } else {
          console.log("Found user data", result);
          socket.emit("auth_success", result);
        }
      }
    );

    var custom_room = mongoose.model(present_room_id, ChatSchema);
    custom_room.find((err, result) => {
      if (err) throw err;
      msg_room_2 = result;
    });
  });

  socket.on("msg", (msg, room, user) => {
    present_room_id = room;
    console.log(`${present_room_id} active!`);
    console.log(`${socket.username} said '${msg}'`);
    let message = mongoose.model(present_room_id, chatschema)
    if(msg.file){
    let save_msg = new message({
      username: user,
      msg: " ",
      date: new moment().format("DD/MM/YYYY HH:mm:ss"),
      room: present_room_id,
      data: { data: new Buffer.from(msg.file).toString("base64"),
              name: msg.file_name,
              contentType: msg.content_type},
      FLAG: 'msg',
      owner: selfID,
    });
    socket.join(room, () => {
      save_msg.save((err, result) => {
        if (err) throw err;
        console.log("query msg _id: ",result.id)
        msg_room_2.push(result);
        io.to(room).emit("msg_room", result);
        let msgtoSync = result;
        msgtoSync["FLAG"] = "msg";

        sendData(msgtoSync, "ALL", result.id);
      });
    });
  }
  else{
    let save_msg = new message({
      username: user,
      msg: msg.msg,
      date: new moment().format("DD/MM/YYYY HH:mm:ss"),
      room: present_room_id,
      FLAG: 'msg',
      owner: selfID,
    });

    socket.join(room, () => {
      save_msg.save((err, result) => {
        if (err) throw err;
        console.log(result);
        console.log("query msg _id: ",result.id)
        msg_room_2.push(result);
        io.to(room).emit("msg_room", result);
        let msgtoSync = result;
        msgtoSync["FLAG"] = "msg";

        sendData(msgtoSync, "ALL", result.id);
      });
    });
    
  }
    return (present_room_id = room);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`${socket.username} has left the chat.`);
    io.emit("userLeft", socket.username);
    users.splice(users.indexOf(socket), 1);
  });
});

http.listen(process.env.PORT || config.port, () => {
  console.log("Listening on port %s", process.env.PORT || config.port);
});

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
let selfID = config.selfID;

initNodeList();

//variable for flow control
let TO_SEND_BUFF = [];
let SENT_BUFF = [];
let RECV_BUFF = {};
let timeoutRoutine = null;

const handler = {
  ECHO: function (data) {
    if (data.FROM in ALL_SERVER) {
      if (ALL_SERVER[data.FROM].status === "OFFLINE") {
        console.warn("Server", ALL_SERVER[data.FROM].name, "back online");
        ALL_SERVER[data.FROM].hop = calcHop(data.FROM,TOPOLOGY);
      }
      ALL_SERVER[data.FROM].status = "ONLINE";
    } else {
      ALL_SERVER[data.FROM] = {};
      ALL_SERVER[data.FROM].name = data.SERVER_NAME;
      ALL_SERVER[data.FROM].status = "ONLINE";
      console.log("added new server", ALL_SERVER[data.FROM].name);
      ALL_SERVER[data.FROM].hop = calcHop(data.FROM,TOPOLOGY);
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
      console.error("ESP failed to send",recentSend.msg.MSG_ID,"because the server is offline");

      exportCSV_SEND(recentSend,Date.now(),false,true,data.HEAP,bytesToSize(os.freemem()),console.log(`${os.loadavg()[1].toFixed(2)} %`),TO_SEND_BUFF.length);

      ALL_NODE[recentSend.to].status = "OFFLINE";
      ALL_SERVER[recentSend.to].status = "OFFLINE";
      console.log("Server", ALL_SERVER[recentSend.to].name, "went OFFLINE");
      exportCSV_NODE(Date.now(),recentSend.to,"OFFINE",true,ALL_SERVER[recentSend.to].name,"MSG")
      
      recentSend.timedout += 1;
      TO_SEND_BUFF.push(recentSend)
    } else {
      console.log("ESP is ready to send next");
    }

    if (TO_SEND_BUFF.length) {
      sendSerialInterval = null;
      setSerialRoutine();
    } else {
      sendSerialInterval = null;
    }
  },
  ACK: function (data) {
    let ACKREVTIME = Date.now();

    for (let [i, msg] of SENT_BUFF.entries()) {
      if (data.ACK_FRAG_ID == -1 && data.ACK_MSG_ID == msg.msg.MSG_ID) {
        console.log("ACK", data.ACK_MSG_ID, "RTT", ACKREVTIME - msg.timeSent);
        SENT_BUFF.splice(i, 1);

        exportCSV_SEND(msg,ACKREVTIME,false,false,data.HEAP,bytesToSize(os.freemem()),console.log(`${os.loadavg()[1].toFixed(2)} %`),TO_SEND_BUFF.length);

        //tag db that this message is sent
        // originalData = JSON.parse(msg.msg.DATA);
        for (i in msg.id){
          if (msg.FFLAG[i] === "msg") {
            //model for querying db
            var chatModel = mongoose.model("ChatSchemaList", ChatSchema);
            chatModel.updateOne(
              { _id: msg.id[i] },
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
          } else if (msg.FFLAG[i] === "room") {
            var roomModel = mongoose.model("RoomSchemaList", RoomSchema);
            roomModel.updateOne(
              { _id: msg.id[i] },
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
          } else if (msg.FFLAG[i] === "user") {
            var userModel = mongoose.model("UserSchemaList", userRegister);
            userModel.updateOne(
              { _id: msg.id[i] },
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
        }
      
        break;
      } else if (
        data.ACK_FRAG_ID == msg.msg.FRAG_ID &&
        data.ACK_MSG_ID == msg.msg.MSG_ID
      ) {
        console.log("ACK",data.ACK_MSG_ID,"FRAG",data.ACK_FRAG_ID,"RTT",ACKREVTIME - msg.timeSent);
        SENT_BUFF[i].ACKED == true;

        exportCSV_SEND(msg,ACKREVTIME,false,false,data.HEAP,bytesToSize(os.freemem()),console.log(`${os.loadavg()[1].toFixed(2)} %`),TO_SEND_BUFF.length);

        //check if all of the fragmented message was acked
        fragLen = msg.msg.FRAG_LEN;
        ackedCount = 0;
        for (let [j, m] of SENT_BUFF.entries()) {
          if (data.ACK_MSG_ID == m.msg.MSG_ID && m.ACKED) {
            ackedCount += 1;
          } else if (data.ACK_MSG_ID == m.msg.MSG_ID && !m.ACKED) {
            break;
          }
        }

        if (ackedCount == msg.msg.FRAG_LEN) {
          for (let [j, m] of SENT_BUFF.entries()) {
            if (data.ACK_MSG_ID == m.msg.MSG_ID) {
              SENT_BUFF.splice(j, 1);
            }
          }
          console.log("ACKED ALL FRAG",data.ACK_MSG_ID,"LENGTH",msg.msg.FRAG_LEN);
        }
        // SENT_BUFF.splice(i, 1);
        break;
      }
    }
  },
  CHANGED_CONNECTION: function (data) {
    NODE_LIST = data.NODE_LIST.split(",");
    TOPOLOGY = JSON.parse(data.TOPOLOGY_JSON);
    // console.log("TOPOLOGY: ", TOPOLOGY);
    console.log('TOPOLOGY CHANGED:', data.TOPOLOGY_JSON)
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
            console.log("notice: server",key,ALL_SERVER[key].name,"back online");
            ALL_SERVER[key].hop = calcHop(key,TOPOLOGY);
            ALL_NODE[key].hop = calcHop(key,TOPOLOGY);
            exportCSV_NODE(Date.now(),key,"ONLINE",true,ALL_SERVER[key].name,"CHANGED_CONNECTION")
            if (TO_SEND_BUFF.length) {
              setSerialRoutine();
            }
          } else {
            console.log("notice: node", key, "back online");
            ALL_NODE[key].hop = calcHop(key,TOPOLOGY);
            exportCSV_NODE(Date.now(),key,"ONLINE",false,"-","CHANGED_CONNECTION")
          }
        }
        ALL_NODE[key].status = "ONLINE";
        NODE_LIST.splice(NODE_LIST.indexOf(key), 1);
      } else {
        if (ALL_NODE[key].status === "ONLINE") {
          if (key in ALL_SERVER) {
            ALL_SERVER[key].status = "OFFLINE";
            console.log("notice: server",key,ALL_SERVER[key].name,"went offline");
            ALL_SERVER[key].hop = -1;
            ALL_NODE[key].hop = -1;
            exportCSV_NODE(Date.now(),key,"OFFLINE",true,ALL_SERVER[key].name,"CHANGED_CONNECTION")
          } else {
            console.log("notice: node", key, "went offline");
            ALL_NODE[key].hop = -1;
            exportCSV_NODE(Date.now(),key,"OFFLINE",false,"-","CHANGED_CONNECTION")
          }
        }
        ALL_NODE[key].status = "OFFLINE";
      }
    }

    console.log("ALL_NODE Final Status", ALL_NODE);
    console.log("ALL_SERVER Final Status", ALL_SERVER);

    //add new node to database
    NODE_LIST.forEach((item, index) => {
      console.log("NEW NODE", item, "ONLINE");
      ALL_NODE[item] = {
        status: "ONLINE",
        hop: calcHop(item)
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
      for (i in data.DATA) {
        extract_json_obj = JSON.parse(data.DATA[i]);
        // console.log(extract_json_obj)
        if (extract_json_obj.FLAG === "msg") {
          
          let message = mongoose.model(present_room_id, ChatSchema);
          let u_name_in_chat = extract_json_obj.username;
          let msg_in_chat = extract_json_obj.msg;
          let date_in_chat = extract_json_obj.date;
          let room_in_chat = extract_json_obj.room;
          let file_in_chat = extract_json_obj.data
          if (room_in_chat !== present_room_id) {
            console.log("mismatch room");
            console.log(`user is: ${u_name_in_chat} msg is: ${msg_in_chat}
            date is: ${date_in_chat} room is: ${room_in_chat} `);
            let message = mongoose.model(room_in_chat, ChatSchema);
            if(file_in_chat){
              let save_msg = new message({
                username: u_name_in_chat,
                msg: msg_in_chat,
                data:{data: new Buffer.from(file_in_chat.file).toString("base64"),
                      name: file_in_chat.file_name,
                      contentType: file_in_chat.content_type},
                date: date_in_chat,
              });
              save_msg.save((err, result) => {
                if (err) throw err;
                msg_room_2.push(result);
                io.to(room_in_chat).emit("msg_room", result);
              });
            }
            else{
              // if no data file
              let save_msg = new message({
                username: u_name_in_chat,
                msg: msg_in_chat,
                date: date_in_chat,
              });
              save_msg.save((err, result) => {
                if (err) throw err;
                msg_room_2.push(result);
                io.to(room_in_chat).emit("msg_room", result);
              });
            }
          } else { // another room
            if(file_in_chat){
              let save_msg = new message({
                username: u_name_in_chat,
                msg: msg_in_chat,
                data:{data: new Buffer.from(file_in_chat.file).toString("base64"),
                      name: file_in_chat.file_name,
                      contentType: file_in_chat.content_type},
                date: date_in_chat,
              });
              save_msg.save((err, result) => {
                if (err) throw err;
                msg_room_2.push(result);
                io.to(present_room_id).emit("msg_room", result);
              });
            }
            else{
              
              let save_msg = new message({
                username: u_name_in_chat,
                msg: msg_in_chat,
                date: date_in_chat,
              });
              save_msg.save((err, result) => {
                if (err) throw err;
                msg_room_2.push(result);
                io.to(present_room_id).emit("msg_room", result);
              });
            }
          }
        }
      }
    } else {
      if (data.MSG_ID in RECV_BUFF[data.FROM]) {
        RECV_BUFF[data.FROM][data.MSG_ID].push(data);
        if (RECV_BUFF[data.FROM][data.MSG_ID].length == data.FRAG_LEN) {
          dataFull = "";
          for (index = 0; index < data.FRAG_LEN; index++) {
            for (let [i, frag] of RECV_BUFF[data.FROM][
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
  },
};

let sendSerialInterval = null;

function setSerialRoutine() {
  if (sendSerialInterval == null) {
    sendSerialInterval = setTimeout(sendToSerial, Math.random() * 500 + 50);
  }
}

function echoServer(dest) {
  msg = {
    msg: {
      MSG_ID: nextMSG_ID(),
      FLAG: "ECHO",
      SERVER_NAME: config.SERVER_NAME,
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

function pickNextMSG() {
  let pickedMsg = null;
  let shiftCount = 0;
  // let ORIGINAL_MSG_QUEUE = []

  while (true) {
    shiftCount += 1;
    let selectedMsg = JSON.parse(JSON.stringify(TO_SEND_BUFF[0]));

    try {
      if (selectedMsg.msg.FLAG == "ECHO") {
        pickedMsg = selectedMsg;
        TO_SEND_BUFF.splice(0, 1);
        return pickedMsg
      } else if (ALL_SERVER[selectedMsg.to].status === "ONLINE") {
        pickedMsg = selectedMsg;
        TO_SEND_BUFF.splice(0, 1);
        if (selectedMsg.msg.FRAG) {
          return pickedMsg
        }
        if (selectedMsg.msg.AGG != 1){
          return pickedMsg
        }
        break;
      } else {
        TO_SEND_BUFF.push(selectedMsg);
        TO_SEND_BUFF.splice(0, 1);
        if (shiftCount == TO_SEND_BUFF.length) {
          break;
        }
      }
    } catch (err) {
      console.log(
        `err ${err} \n, ${selectedMsg},to send buff len ${TO_SEND_BUFF.length}`
      );
      console.log("to send bugg", TO_SEND_BUFF);
      console.log("AllServer", ALL_SERVER);
      break;
    }
  }
  if (pickedMsg == null) {
    console.log("no candidate");
    return pickedMsg
  }
  // ORIGINAL_MSG_QUEUE.push(JSON.stringify(pickedMsg));

  totalMsgLen = pickedMsg.msg.DATA[0].length;
  console.log('begin aggregation with length', totalMsgLen);

  while (totalMsgLen < config.MTU){
    nextCandidate = null
    for (i in TO_SEND_BUFF) {
      if (TO_SEND_BUFF[i].msg.FLAG != "ECHO" && TO_SEND_BUFF[i].to == pickedMsg.to && !TO_SEND_BUFF[i].msg.FRAG && TO_SEND_BUFF[i].msg.AGG == 1){
        nextCandidate = i
        console.log('trying to aggregate MSG',TO_SEND_BUFF[nextCandidate].msg.MSG_ID, 'to MSG',pickedMsg.msg.MSG_ID, 'original length',totalMsgLen)
        break;
      }
    }

    if (nextCandidate == null) {
      console.log('Aggregation stop there is no suitable candidate')
      break;
    } else if (totalMsgLen + TO_SEND_BUFF[nextCandidate].msg.DATA[0].length > config.MTU){
      console.log('Aggregation stop result will exceed MTU')
      break;
    } else {
      pickedMsg.id.push(TO_SEND_BUFF[nextCandidate].id[0]);
      pickedMsg.msg.AGG += 1;
      pickedMsg.AGGED += String(TO_SEND_BUFF[nextCandidate].msg.MSG_ID);
      pickedMsg.AGGED += " ";
      pickedMsg.msg.DATA.push(TO_SEND_BUFF[nextCandidate].msg.DATA[0]);
      pickedMsg.FFLAG.push(TO_SEND_BUFF[nextCandidate].FFLAG[0]);
      totalMsgLen += TO_SEND_BUFF[nextCandidate].msg.DATA[0].length;
      console.log('aggregated MSG',TO_SEND_BUFF[nextCandidate].msg.MSG_ID, 'to MSG',pickedMsg.msg.MSG_ID, 'new length', totalMsgLen)
      TO_SEND_BUFF.splice(nextCandidate, 1);
    }
  }

  console.log('aggregated final length', totalMsgLen, 'aggregated', pickedMsg.msg.AGG, 'contains', pickedMsg.AGGED)
  return pickedMsg
}

function sendToSerial() {
  let msgToSend = null;
  if (TO_SEND_BUFF.length) {
    msgToSend = pickNextMSG();
    // msgToSend = TO_SEND_BUFF.shift();
    if (msgToSend != null) {
      console.log("\t sending",msgToSend.msg.FLAG,"ID:",msgToSend.msg.MSG_ID);
      // console.log(msgToSend);
      PORT.write(JSON.stringify(msgToSend.msg));
      msgToSend.timeSent = Date.now();
      SENT_BUFF.push(msgToSend);

      //set routine to track message timeout
      if (timeoutRoutine == null) {
        timeoutRoutine = setInterval(msgTimeout, 500);
      }
    } else {
      console.log(
        "nothing to send all server is offline",TO_SEND_BUFF.length,"msg in queue");
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
    for (let [i, msg] of SENT_BUFF.entries()) {
      if (msg.msg.FLAG === "ECHO") {
        SENT_BUFF.splice(i, 1);
      } else if (Date.now() - msg.timeSent >= config.TIMEOUT[ALL_SERVER[msg.to].hop]) {
        currentTime = Date.now();
        var timedoutMsg = msg;

        exportCSV_SEND(timedoutMsg, Date.now(), true, false, null, bytesToSize(os.freemem()), console.log(`${os.loadavg()[1].toFixed(2)} %`), TO_SEND_BUFF.length );

        timedoutMsg.timedout += 1;

        if (timedoutMsg.timedout >= 5) {
          console.log("TIMEDOUT:", timedoutMsg.msg.MSG_ID, "discarded this message at", (currentTime - msg.timeSent) / 1000, "sec" );
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

  for (let [i, frag] of dataFrag.entries()) {
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
    id: [_id],
    FFLAG: [FLAG],
    AGGED: "",
    msg: {
      MSG_ID: nextMSG_ID(),
      FLAG: "DATA",
      FRAG: false,
      AGG: 1,
      DATA: [dataStr],
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
        console.log("will send to", server);
        sendFragment(dataStr, server, _id, data.FLAG);
        // if (ALL_SERVER[server].status === "ONLINE") {
        //   console.log("will send to", server);
        //   sendFragment(dataStr, server, _id, data.FLAG);
        // }
      }
    } else {
      sendFragment(dataStr, dest, _id, data.FLAG);
    }
  } else {
    if (dest === "ALL") {
      for (var server in ALL_SERVER) {
        console.log("will send to", server, ALL_SERVER[server]);
        sendSingle(dataStr, server, _id, data.FLAG);
        if (ALL_SERVER[server].status === "ONLINE") {
          // console.log("will send to", server, ALL_SERVER[server]);
          // sendSingle(dataStr, server, _id, data.FLAG);
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
        hop: -1
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
        hop: -1
      };
    }
    console.log("SERVER LIST", SERVER_LIST);
    console.log("ALL SERVER", ALL_SERVER);
  });
}

//  console.log('free memory : ', bytesToSize(os.freemem()));
//  console.log('total memory : ', bytesToSize(os.totalmem()));

function calcmsgLenSend(msg){
  ml = 0
  for (i in msg.msg.DATA){
    ml += msg.msg.DATA[i].length
  }
  return ml
}

function calcmsgLenRecv(msg){
  ml = 0
  for (i in msg.DATA){
    ml += msg.DATA[i].length
  }
  return ml
}

function exportCSV_RECV(data, recvTime) {
  csvWriter_RECV.writeRecords([
    {
      MSG_ID: data.MSG_ID,
      IS_FRAG: data.FRAG,
      FRAG_ID: data.FRAG_ID,
      FRAG_LEN: data.FRAG_LEN,
      DATA_LEN: calcmsgLenRecv(data),
      T_RECV: recvTime,
      HOP: ALL_SERVER[data.FROM].hop,
      AGGREGATE: data.AGG,
      HEAP: data.HEAP,
      Free_Mem: bytesToSize(os.freemem()),
      CPU_Load: cpu_usage(os.loadavg()[1]),
	    Message_in_Buffer: TO_SEND_BUFF.length,
    },
  ]);
}

function exportCSV_SEND(data, currentTime, isTimedOut, isError, HEAP, FREE, CPU, Buffer) {
  if (isTimedOut) {
    csvWriter_SEND.writeRecords([
      {
        MSG_ID: data.msg.MSG_ID,
        IS_FRAG: data.msg.FRAG,
        FRAG_ID: data.msg.FRAG_ID,
        FRAG_LEN: data.msg.FRAG_LEN,
        AGGREGATE: data.msg.AGG,
        AGGED: data.AGGED,
        MSG_TYPE: data.msg.FLAG,
        DATA_LEN: calcmsgLenSend(data),
        ERROR: "TIMEDOUT",
        timedout: data.timedout,
        T_SEND: data.timeSent,
        T_TIMEDOUT: currentTime,
        T_ERROR: "-",
        T_ACK_RECV: "-",
        HOP: ALL_SERVER[data.to].hop,
        HEAP: "-",
        Free_Mem: FREE,
        CPU_Load: CPU,
        Message_in_Buffer: Buffer,
      },
    ]);
  } else if (isError) {
    csvWriter_SEND.writeRecords([
      {
        MSG_ID: data.msg.MSG_ID,
        IS_FRAG: data.msg.FRAG,
        FRAG_ID: data.msg.FRAG_ID,
        FRAG_LEN: data.msg.FRAG_LEN,
        AGGREGATE: data.msg.AGG,
        AGGED: data.AGGED,
        MSG_TYPE: data.msg.FLAG,
        DATA_LEN: calcmsgLenSend(data),
        ERROR: "ESP32",
        TIMEDOUT: data.timedout,
        T_SEND: data.timeSent,
        T_TIMEDOUT: "-",
        T_ERROR: currentTime,
        T_ACK_RECV: "-",
        HOP: -1,
        HEAP: HEAP,
        Free_Mem: bytesToSize(os.freemem()),
        CPU_Load: cpu_usage(os.loadavg()[1]),
        Message_in_Buffer: TO_SEND_BUFF.length,
      },
    ]);
  } else {
    csvWriter_SEND.writeRecords([
      {
        MSG_ID: data.msg.MSG_ID,
        IS_FRAG: data.msg.FRAG,
        FRAG_ID: data.msg.FRAG_ID,
        FRAG_LEN: data.msg.FRAG_LEN,
        AGGREGATE: data.msg.AGG,
        AGGED: data.AGGED,
        MSG_TYPE: data.msg.FLAG,
        DATA_LEN: calcmsgLenSend(data),
        ERROR: "NONE",
        TIMEDOUT: data.timedout,
        T_SEND: data.timeSent,
        T_TIMEDOUT: "-",
        T_ERROR: "-",
        T_ACK_RECV: currentTime,
        HOP: ALL_SERVER[data.to].hop,
        HEAP: HEAP,
        Free_Mem: bytesToSize(os.freemem()),
        CPU_Load: cpu_usage(os.loadavg()[1]),
        Message_in_Buffer: TO_SEND_BUFF.length,
      },
    ]);
  }
}

function exportCSV_NODE(currentTime, nodeID, event, isServer, serverName, source) {
  csvWriter_NODE.writeRecords([
    {
      TIME: currentTime,
      EVENT: event,
      NODE_ID: nodeID,
      IS_SERVER: isServer,
      SERVER_NAME: serverName,
      SOURCE: source,
      HOP: ALL_NODE[nodeID].hop
    },
  ]);
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

//function for logging data
const createCSVWriter_SEND = require("csv-writer").createObjectCsvWriter;
const csvWriter_SEND = createCSVWriter_SEND({
  path: "/home/ubuntu/log/SEND.csv",
  header: [
    { id: "MSG_ID", title: "MSG_ID" },
    { id: "IS_FRAG", title: "IS_FRAG" },
    { id: "FRAG_ID", title: "FRAG_ID" },
    { id: "FRAG_LEN", title: "FRAG_LEN" },
    { id: "AGGREGATE", title: "AGGREGATE"},
    { id: "AGGED", title: "AGGED"},
    { id: "MSG_TYPE", title: "MSG_TYPE" },
    { id: "DATA_LEN", title: "DATA_LEN" },
    { id: "ERROR", title: "ERROR" },
    { id: "TIMEDOUT", title: "TIMEDOUT" },
    { id: "T_SEND", title: "T_SEND" },
    { id: "T_TIMEDOUT", title: "T_TIMEDOUT" },
    { id: "T_ERROR", title: "T_ERROR"} ,
    { id: "T_ACK_RECV", title: "T_ACK_RECV" },
    { id: "HOP", title: "HOP" },
    { id: "HEAP", title: "HEAP" },
    { id: "Free_Mem", title: "MEM_FREE" },
    { id: "CPU_Load", title: "CPU_LOAD" },
    { id: "Message_in_Buffer", title: "MSG_IN_BUFF" },
  ],
});

const createCSVWriter_RECV = require("csv-writer").createObjectCsvWriter;
const csvWriter_RECV = createCSVWriter_RECV({
  path: "/home/ubuntu/log/RECV.csv",
  header: [
    { id: "MSG_ID", title: "MSG_ID" },
    { id: "IS_FRAG", title: "IS_FRAG" },
    { id: "FRAG_ID", title: "FRAG_ID" },
    { id: "FRAG_LEN", title: "FRAG_LEN" },
    { id: "AGGREGATE", title: "AGGREGATE"},
    { id: "DATA_LEN", title: "DATA_LEN" },
    { id: "T_RECV", title: "T_RECV" },
    { id: "HOP", title: "HOP" },
    { id: "HEAP", title: "HEAP" },
    { id: "Free_Mem", title: "MEM_FREE" },
    { id: "CPU_Load", title: "CPU_LOAD" },
    { id: "Message_in_Buffer", title: "MSG_IN_BUFF" },
  ],
});

const createCSVWriter_NODE = require("csv-writer").createObjectCsvWriter;
const csvWriter_NODE = createCSVWriter_NODE({
  path: "/home/ubuntu/log/NODE.csv",
  header: [
    { id: "TIME", title: "TIME" },
    { id: "EVENT", title: "EVENT" },
    { id: "NODE_ID", title: "NODE_ID" },
    { id: "IS_SERVER", title: "IS_SERVER" },
    { id: "SERVER_NAME", title: "SERVER_NAME" },
    { id: "SOURCE", title: "SOURCE" },
    { id: "HOP", title: "HOP" },
  ],
});