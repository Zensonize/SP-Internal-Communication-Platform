var app = require("express")();
var config = require("./config");
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
  res.render("/", { tile: "Emergency Chat System V1.1" });
});
var http = require("http").Server(app);

var io = require("socket.io")(http);

var mongoose = require("mongoose");
let users = [];
let messages = [];
let msg_room_2 = [];
var room_lists = [];
var lists = [];
var present_room_id = "";
const moment = require("moment");
const { error } = require("console");
moment.locale("th");

mongoose.connect(config.db, {
  auth: {
    authSource: "admin",
  },
  user: "admin",
  pass: "sunat1998",
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

var chatschema = mongoose.Schema({
  username: String,
  msg: String,
  date: String,
});

var RoomModel = mongoose.Schema({
  RoomID: String,
});

var room_list = mongoose.model("room_list", RoomModel);
room_list.find({}, { RoomID: 1, _id: 0 }, (err, result) => {
  result
    .map(({ RoomID }) => RoomID)
    .forEach((element) => {
      lists.push(element);
    });
  room_lists = result;
});

const userRegister = mongoose.Schema({
  registername: String,
  password: String,
});

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
          let new_room = mongoose.model(data, chatschema);
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

    var custom_room = mongoose.model(present_room_id, chatschema);
    custom_room.find((err, result) => {
      if (err) throw err;
      msg_room_2 = result;
    });
  });

  socket.on("msg", (msg, room, user) => {
    present_room_id = room;
    console.log(`${present_room_id} active!`);
    console.log(`${socket.username} said '${msg}'`);

    let message = mongoose.model(present_room_id, chatschema);
    let save_msg = new message({
      username: user,
      msg: msg,
      date: new moment().format("DD/MM/YYYY HH:mm:ss"),
    });
    socket.join(room, () => {
      save_msg.save((err, result) => {
        if (err) throw err;
        console.log(result);
        msg_room_2.push(result);
        io.to(room).emit("msg_room", result);
        sendData(result);
      });
    });
    //   socket.on("passthrough"), (payload) => {
    //     sendData(payload);
    // }

    return (present_room_id = room);
  });

  // Disconnect
  socket.on("disconnect", () => {
    if (socket.username) {
      // throw socket.username
      users.splice(users.indexOf(socket), 0);
    } else {
      console.log(`${socket.username} has left the chat.`);
      io.emit("userLeft", socket.username);
      users.splice(users.indexOf(socket), 1);
    }
  });
});

http.listen(process.env.PORT || config.port, () => {
  console.log("Listening on port %s", process.env.PORT || config.port);
});

/** ESP32 Zone **/
//listen to serial port
var SerialPort = require("serialport");
const ReadLine = require("@serialport/parser-readline");
const PORT = new SerialPort(config.SERIAL_PORT, { baudRate: config.BUADRATE});
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
let SERVER_LIST = {};
let NODE_LIST = [];
let TOPOLOGY = {};

//variable for flow control
let TO_SEND_BUFF = [];
let SENT_BUFF = [];
let RECV_BUFF = {};
let isFree = true;
let timeoutRoutine = null;

const handler = {
  ECHO: function (data) {
    if (data.FROM in SERVER_LIST) {
      if (SERVER_LIST[data.FROM].SERVER_STATUS === "OFFLINE") {
        console.warn(
          "Server",
          SERVER_LIST[data.FROM].SERVER_NAME,
          "back online"
        );
      }
      SERVER_LIST[data.FROM].SERVER_STATUS = "ONLINE";
    } else {
      SERVER_LIST[data.FROM] = {};
      SERVER_LIST[data.FROM].SERVER_NAME = data.SERVER_NAME;
      SERVER_LIST[data.FROM].SERVER_STATUS = "ONLINE";
      console.log("added new server", SERVER_LIST[data.FROM].SERVER_NAME);
      RECV_BUFF[data.FROM] = {};
    }
  },
  READY: function (data) {
    isFree = true;
    if (!data.SUCCESS) {
      recentSend = SENT_BUFF.pop();
      if (recentSend.retires >= 3) {
        console.error("ESP failed to send", recentSend.msg.MSG_ID);
      } else {
        console.log('ESP will retires to send within', TO_SEND_BUFF.length)
        TO_SEND_BUFF.push(recentSend);
        sendToSerial();
      }
    }
    else {
      console.log('ESP is ready to send next')
      sendToSerial()
    }
  },
  ACK: function (data) {
    for (const [i, msg] of SENT_BUFF.entries()) {
      if (data.ACK_FRAG_ID == -1 && data.ACK_MSG_ID == msg.msg.MSG_ID) {
        console.log("ACK", data.ACK_MSG_ID, "RTT", Date.now() - msg.timeSent);
        SENT_BUFF.splice(i, 1);
        break;
      } else if (
        data.ACK_FRAG_ID == msg.msg.FRAG_ID &&
        data.ACK_MSG_ID == msg.msg.MSG_ID
      ) {
        console.log(
          "ACK",
          data.ACK_MSG_ID,
          "FRAG",
          data.ACK_FRAG_ID,
          "RTT",
          Date.now() - msg.timeSent
        );
        SENT_BUFF.splice(i, 1);
        break;
      }
    }
  },
  CHANGED_CONNECTION: function (data) {
    NODE_LIST = data.NODE_LIST;
    TOPOLOGY = data.TOPOLOGY;

    Object.keys(SERVER_LIST).forEach((key, index) => {
      if (!NODE_LIST.includes(key)) {
        SERVER_LIST[key].SERVER_STATUS = "OFFLINE";
      }
    });
    bcastServer();
  },
  DATA: function (data) {
    if (!data.FRAG) {
      console.log("RECEIVED ", data.MSG_ID);
      console.log("msg is: ", data.DATA);
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
};

function bcastServer() {
  msg = {
    retires: 0,
    msg: {
      MSG_ID: nextMSG_ID(),
      FLAG: "ECHO",
      SERVER_NAME: "SERVER A",
    },
  };
  TO_SEND_BUFF.push(msg);
  sendToSerial();
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
  if (isFree && TO_SEND_BUFF.length) {
    isFree = false;
    msgToSend = TO_SEND_BUFF.shift();
    console.log("sending", msgToSend.msg.FLAG, "ID:", msgToSend.msg.MSG_ID);
    console.log(msgToSend);
    PORT.write(JSON.stringify(msgToSend.msg));
    msgToSend.timeSent = Date.now();
    msgToSend.retires += 1;
    SENT_BUFF.push(msgToSend);

    //set routine to track message timeout
    if (timeoutRoutine == null) {
      timeoutRoutine = setInterval(msgTimeout, 500);
    }
  } else if (!isFree) {
    console.log("ESP32 is not ready", TO_SEND_BUFF.length, "message in queue");
    PORT.flush()
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
        timedoutMsg.timedout += 1;

        if (timedoutMsg.timedout >= 5) {
          console.log(
            "TIMEDOUT:",
            timedoutMsg.msg.MSG_ID,
            "discarded this message",
            (currentTime - msg.timeSent) / 1000,
            "sec"
          );
        } else {
          console.log(
            "TIMEDOUT:",
            timedoutMsg.msg.MSG_ID,
            "retry sending",
            (currentTime - msg.timeSent) / 1000,
            "sec"
          );

          TO_SEND_BUFF.push(timedoutMsg);
          SENT_BUFF.splice(i, 1);
          sendToSerial();
        }
      }
    }
  }
}

function sendData(data) {
  dataStr = JSON.stringify(data);

  if (dataStr.length > config.MTU) {
    //send data in fragment
    dataFrag = chunkSubstr(dataStr, config.MTU);
    msg = {
      retires: 0,
      timedout: 0,
      msg: {
        FLAG: "DATA",
        FRAG: true,
        FRAG_LEN: dataFrag.length,
      },
    };
    Object.keys(SERVER_LIST).forEach((key, index) => {
      msg.msg.FRAG_ID = 0;
      msg.msg.TOA = convertDstAddr(key)[0];
      msg.msg.TOB = convertDstAddr(key)[1];
      msg.msg.MSG_ID = nextMSG_ID();

      for (const [i, frag] of dataFrag.entries()) {
        msg.msg.DATA = frag;
        msg.msg.FRAG_ID = msg.msg.FRAG_ID++;

        TO_SEND_BUFF.push(msg);
        sendToSerial();
      }
    });
  } else {
    msg = {
      retires: 0,
      timedout: 0,
      msg: {
        FLAG: "DATA",
        FRAG: false,
        DATA: dataStr,
      },
    };
    Object.keys(SERVER_LIST).forEach((key, index) => {
      msg.msg.TOA = convertDstAddr(key)[0];
      msg.msg.TOB = convertDstAddr(key)[1];
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
