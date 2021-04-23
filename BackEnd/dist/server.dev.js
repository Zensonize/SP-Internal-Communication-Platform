"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var app = require("express")();

var config = require("./config");

var schema = require("./db/schema");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", config.host);
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Option, Authorization");
  next();
});
app.get("/", function (req, res) {
  res.render("/", {
    tile: "Emergency Chat System V1.1"
  });
});

var http = require("http").Server(app);

var io = require("socket.io")(http);

var mongoose = require("mongoose");

var users = [];
var msg_room_2 = [];
var room_lists = [];
var lists = [];
var present_room_id = "";

var moment = require("moment");

moment.locale("th");
mongoose.connect(config.db, {
  auth: {
    authSource: config.username_mongoDB
  },
  user: config.username_mongoDB,
  pass: config.password_mongoDB,
  useUnifiedTopology: true,
  useNewUrlParser: true
});
mongoose.connection.on("error", function (err) {
  console.log(err);
});
mongoose.connection.on("connected", function (err, res) {
  if (err) throw err;
  console.log("mongoose is connected");
});
var ChatSchema = schema.chat_schema;
var RoomSchema = schema.Room_schema;
var room_list = mongoose.model("room_list", RoomSchema);
var NodeSchema = schema.Node_schema;
var NodeSchema_list = mongoose.model("NodeSchema_list", NodeSchema);
room_list.find({}, {
  RoomID: 1,
  _id: 0
}, function (err, result) {
  result.map(function (_ref) {
    var RoomID = _ref.RoomID;
    return RoomID;
  }).forEach(function (element) {
    lists.push(element);
  });
  room_lists = result;
});
var userRegister = schema.user_register;
var userDataModel = mongoose.model("user_register", userRegister);
userDataModel.find(function (err, result) {
  if (err) throw err;
  nameinchat = result;
});
io.on("connection", function (socket) {
  socket.emit("passthrough", "asd");

  if (present_room_id) {
    console.log("connecting to:", present_room_id);
  }

  socket.emit("loggedIn", {
    users: users.map(function (s) {
      return s.username;
    }),
    messages: msg_room_2,
    room: present_room_id
  });
  socket.emit("list_rooms", room_lists);
  socket.on("newuser", function (username) {
    console.log("".concat(username, " has join at the chat."));
    socket.username = username;

    if (socket) {
      users.push(socket);
    }

    if (socket.username !== "undefined") {
      io.emit("userOnline", socket.username);
    }
  });
  socket.on("user_regis", function (userdata, userpassword) {
    var Data = new userDataModel({
      registername: userdata,
      password: userpassword
    });
    console.log("Username is ".concat(Data.registername, " Password is ").concat(Data.password));
    console.log("Register Sucessfully!");
    Data.save(function (err, result) {
      if (err) throw err;
      io.emit("regis_success", "Register Success!");
    });
  });
  socket.on("user_create_room", function (data) {
    console.log(data);
    room_list.find({
      RoomID: data
    }, function (err, result) {
      if (err) throw err;
      console.log(result);

      if (result.length === 0) {
        console.log("This room name ".concat(data, " is not created"));
        var new_room = mongoose.model(data, ChatSchema);
        var data_room = new new_room({
          username: "Admin",
          msg: "Welcome to ".concat(data),
          date: new moment().format("DD/MM/YYYY HH:mm:ss")
        });
        var room = new room_list({
          RoomID: data
        });
        room.save(data);
        data_room.save(function (err, result) {
          if (err) throw err;
          console.log(result);
          socket.emit("create_success", "Create Room Successfully!");
        });
      } else {
        console.log("This room name ".concat(data, " already created"));
        socket.emit("unable_to_create", {
          msg: "Room is existed",
          room_existed: data
        });
      }
    });
  });
  socket.on("get_room_list", function (payload) {
    console.log(payload);
    room_list.find(function (err, result) {
      if (err) throw err;
      socket.emit("room_lists_result", result);
    });
  });
  socket.on("user_auth", function (user_payload, password_payload, room) {
    present_room_id = room;
    console.log("User join to ", room);
    userDataModel.find({
      registername: user_payload,
      password: password_payload
    }, function (err, result) {
      if (err) throw err;

      if (result.length === 0) {
        console.log("Data not found");
        socket.emit("auth_fail", "Username or Password is wrong");
      } else {
        console.log("Found user data", result);
        socket.emit("auth_success", result);
      }
    });
    var custom_room = mongoose.model(present_room_id, ChatSchema);
    custom_room.find(function (err, result) {
      if (err) throw err;
      msg_room_2 = result;
    });
  });
  socket.on("msg", function (msg, room, user) {
    present_room_id = room;
    console.log("".concat(present_room_id, " active!"));
    console.log("".concat(socket.username, " said '").concat(msg, "'"));
    var message = mongoose.model(present_room_id, ChatSchema);
    var save_msg = new message({
      username: user,
      msg: msg,
      date: new moment().format("DD/MM/YYYY HH:mm:ss"),
      room: present_room_id,
      FLAG: "msg",
      owner: selfID
    });
    socket.join(room, function () {
      save_msg.save(function (err, result) {
        if (err) throw err;
        console.log(result);
        msg_room_2.push(result);
        io.to(room).emit("msg_room", result);
        var msgtoSync = result;
        msgtoSync["FLAG"] = "msg";
        setTimeout(function () {
          sendData(msgtoSync, "ALL", result.id);
        }, 750);
      });
    }); //   socket.on("passthrough"), (payload) => {
    //     sendData(payload);
    // }

    return present_room_id = room;
  }); // Disconnect

  socket.on("disconnect", function () {
    if (socket.username) {
      // throw socket.username
      users.splice(users.indexOf(socket), 0);
    } else {
      console.log("".concat(socket.username, " has left the chat."));
      io.emit("userLeft", socket.username);
      users.splice(users.indexOf(socket), 1);
    }
  });
});
http.listen(process.env.PORT || config.port, function () {
  console.log("Listening on port %s", process.env.PORT || config.port);
});
/** ESP32 Zone **/
//listen to serial port

var SerialPort = require("serialport");

var ReadLine = require("@serialport/parser-readline");

var PORT = new SerialPort(config.SERIAL_PORT, {
  baudRate: config.BUADRATE
});
var parser = PORT.pipe(new ReadLine({
  delimiter: "\n"
}));
PORT.on("open", function () {
  console.info("serial port open");
});
parser.on("data", function (data) {
  try {
    var dataJSON = JSON.parse(data);
    serialHandler(dataJSON);
  } catch (err) {
    console.error("not parseable", data, err.name, err.message);
  }
}); //const for local operation

var MSG_ID = 0;
var ALL_SERVER = {};
var ALL_NODE = {};
var TOPOLOGY = {};
var selfID = "";
initNodeList(); //variable for flow control

var TO_SEND_BUFF = [];
var SENT_BUFF = [];
var RECV_BUFF = {};
var isFree = true;
var timeoutRoutine = null;
var handler = {
  ECHO: function ECHO(data) {
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
      NodeSchema_list.updateOne({
        nodeID: data.FROM
      }, {
        isServer: true,
        nodeName: data.SERVER_NAME
      }, function (err, result) {
        if (err) throw err;
        console.log(result);
      });
    }
  },
  READY: function READY(data) {
    isFree = true;

    if (!data.SUCCESS) {
      recentSend = SENT_BUFF.pop();

      if (recentSend.retires >= 3) {
        console.error("ESP failed to send", recentSend.msg.MSG_ID, "because the node is offline");
      } else {
        // console.log('ESP will retires to send within', TO_SEND_BUFF.length)
        // TO_SEND_BUFF.push(recentSend);
        // sendToSerial();
        ALL_NODE[recentSend.to].status = "OFFLINE";
        ALL_SERVER[recentSend.to].status = "OFFLINE";
        console.log("Server", ALL_SERVER[recentSend.to].name, "went OFFLINE");
      }
    } else {
      console.log("ESP is ready to send next");
      sendToSerial();
    }
  },
  ACK: function ACK(data) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = SENT_BUFF.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _slicedToArray(_step.value, 2),
            i = _step$value[0],
            _msg = _step$value[1];

        if (data.ACK_FRAG_ID == -1 && data.ACK_MSG_ID == _msg.msg.MSG_ID) {
          console.log("ACK", data.ACK_MSG_ID, "RTT", Date.now() - _msg.timeSent);
          SENT_BUFF.splice(i, 1); //tag db that this message is sent
          // originalData = JSON.parse(msg.msg.DATA);

          if (_msg.FFLAG === "msg") {
            //model for querying db
            var chatModel = mongoose.model("ChatSchemaList", ChatSchema);
            chatModel.updateOne({
              _id: _msg.id
            }, {
              $push: {
                synced: _msg.to
              }
            }, function (err, result) {
              if (err) throw err;
              console.log("updated chat db after synced", result);
            });
          } else if (originalData.FLAG === "room") {
            var roomModel = mongoose.model("RoomSchemaList", RoomSchema);
            roomModel.updateOne({
              _id: _msg.id
            }, {
              $push: {
                synced: _msg.to
              }
            }, function (err, result) {
              if (err) throw err;
              console.log("updated room db after synced", result);
            });
          } else if (originalData.FLAG === "user") {
            var userModel = mongoose.model("UserSchemaList", userRegister);
            userModel.updateOne({
              _id: _msg.id
            }, {
              $push: {
                synced: _msg.to
              }
            }, function (err, result) {
              if (err) throw err;
              console.log("updated user db after synced", result);
            });
          }

          break;
        } else if (data.ACK_FRAG_ID == _msg.msg.FRAG_ID && data.ACK_MSG_ID == _msg.msg.MSG_ID) {
          console.log("ACK", data.ACK_MSG_ID, "FRAG", data.ACK_FRAG_ID, "RTT", Date.now() - _msg.timeSent);
          SENT_BUFF.splice(i, 1);
          break;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  },
  CHANGED_CONNECTION: function CHANGED_CONNECTION(data) {
    NODE_LIST = data.NODE_LIST.split(",");
    TOPOLOGY = JSON.parse(data.TOPOLOGY_JSON);
    console.log("TOPOLOGY: ", TOPOLOGY);
    NODE_LIST.splice(NODE_LIST.indexOf(selfID), 1);
    console.log("ALL_NODE BEFORE", ALL_NODE);
    console.log("ALL_SERVER BEFORE", ALL_SERVER); //update status of the node

    for (var key in ALL_NODE) {
      console.log("KEY", key, "data in ALL_NODE", ALL_NODE[key]);

      if (NODE_LIST.indexOf(key) >= 0) {
        console.log("KEY", key, "data in ALL_NODE", ALL_NODE[key], "Key already included");

        if (ALL_NODE[key].status === "OFFLINE") {
          if (key in ALL_SERVER) {
            console.log("KEY", key, "data in ALL_SERVER", ALL_SERVER[key]);
            ALL_SERVER[key].status = "ONLINE";
            console.log("notice: server", key, ALL_SERVER[key].name, "back online");
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

    console.log("ALL_NODE new Status", ALL_NODE);
    console.log("ALL_SERVER new Status", ALL_SERVER); //add new node to database

    NODE_LIST.forEach(function (item, index) {
      console.log("NEW NODE", item, "index", index);
      ALL_NODE[item] = {
        status: "ONLINE"
      };
      var new_node = new NodeSchema_list({
        nodeID: item,
        isServer: false,
        nodeName: ""
      });
      new_node.save(function (err, result) {
        if (err) throw err;
        console.log(result);
      });
      echoServer(item);
    });
    console.log("ALL_NODE AFTER", ALL_NODE);
    console.log("ALL_SERVER AFTER", ALL_SERVER); // bcastServer();
  },
  DATA: function DATA(data) {
    if (!data.FRAG) {
      console.log("RECEIVED ", data.MSG_ID, "ESP HEAP: ", data.HEAP);
      console.log("msg is: ", data.DATA);
      console.log("send msg to: ", present_room_id);
      var extract_json_obj = JSON.parse(data.DATA); // console.log(extract_json_obj)

      if (extract_json_obj.FLAG === "msg") {
        var message = mongoose.model(present_room_id, ChatSchema);
        var u_name_in_chat = extract_json_obj.username;
        var msg_in_chat = extract_json_obj.msg;
        var date_in_chat = extract_json_obj.date;
        var room_in_chat = extract_json_obj.room;

        if (room_in_chat !== present_room_id) {
          console.log("mismatch room");
          console.log("user is: ".concat(u_name_in_chat, " msg is: ").concat(msg_in_chat, "\n          date is: ").concat(date_in_chat, " room is: ").concat(room_in_chat, " "));

          var _message = mongoose.model(room_in_chat, ChatSchema);

          var save_msg = new _message({
            username: u_name_in_chat,
            msg: msg_in_chat,
            date: date_in_chat
          });
          save_msg.save(function (err, result) {
            if (err) throw err; // console.log(result);

            msg_room_2.push(result);
            io.to(room_in_chat).emit("msg_room", result);
          });
        } else {
          var _save_msg = new message({
            username: u_name_in_chat,
            msg: msg_in_chat,
            date: date_in_chat
          });

          _save_msg.save(function (err, result) {
            if (err) throw err; // console.log(result);

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
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = RECV_BUFF[data.FROM][data.MSG_ID].entries()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var _step2$value = _slicedToArray(_step2.value, 2),
                    i = _step2$value[0],
                    frag = _step2$value[1];

                if (frag.FRAG_ID == index) {
                  dataFull += frag.DATA;
                  break;
                }
              }
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
                  _iterator2["return"]();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
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
  INIT: function INIT(data) {
    console.log(data);
    selfID = data.NODE_ID;
    console.log("INIT SELF ID", selfID);
  }
};

function bcastServer() {
  msg = {
    retires: 0,
    msg: {
      MSG_ID: nextMSG_ID(),
      FLAG: "ECHO",
      SERVER_NAME: "SERVER A"
    }
  };
  TO_SEND_BUFF.push(msg);
  sendToSerial();
}

function echoServer(dest) {
  msg = {
    retires: 0,
    msg: {
      MSG_ID: nextMSG_ID(),
      FLAG: "ECHO",
      SERVER_NAME: "SERVER A",
      TOA: convertDstAddr(dest)[0],
      TOB: convertDstAddr(dest)[1]
    }
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
    SENT_BUFF.push(msgToSend); //set routine to track message timeout

    if (timeoutRoutine == null) {
      timeoutRoutine = setInterval(msgTimeout, 500);
    }
  } else if (!isFree) {
    console.log("ESP32 is not ready", TO_SEND_BUFF.length, "message in queue");
    PORT.flush();
  }
}

function msgTimeout() {
  if (!SENT_BUFF) {
    clearInterval(timeoutRoutine);
    timeoutRoutine = null;
  } else {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = SENT_BUFF.entries()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var _step3$value = _slicedToArray(_step3.value, 2),
            i = _step3$value[0],
            _msg2 = _step3$value[1];

        if (_msg2.msg.FLAG === "ECHO") {
          SENT_BUFF.splice(i, 1);
        } else if (Date.now() - _msg2.timeSent >= config.TIMEOUT) {
          currentTime = Date.now();
          var timedoutMsg = _msg2;
          timedoutMsg.timedout += 1;

          if (timedoutMsg.timedout >= 5) {
            console.log("TIMEDOUT:", timedoutMsg.msg.MSG_ID, "discarded this message", (currentTime - _msg2.timeSent) / 1000, "sec");
          } else {
            console.log("TIMEDOUT:", timedoutMsg.msg.MSG_ID, "retry sending", (currentTime - _msg2.timeSent) / 1000, "sec");
            TO_SEND_BUFF.push(timedoutMsg);
            SENT_BUFF.splice(i, 1);
            sendToSerial();
          }
        }
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
          _iterator3["return"]();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }
  }
}

function sendFragment(dataStr, dest, _id, FLAG) {
  dataFrag = chunkSubstr(dataStr, config.MTU);
  msg = {
    retires: 0,
    timedout: 0,
    to: dest,
    id: _id,
    FFLAG: FLAG,
    msg: {
      MSG_ID: nextMSG_ID(),
      FLAG: "DATA",
      FRAG: true,
      FRAG_ID: 0,
      FRAG_LEN: dataFrag.length,
      TOA: convertDstAddr(dest)[0],
      TOB: convertDstAddr(dest)[1]
    }
  };
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = dataFrag.entries()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var _step4$value = _slicedToArray(_step4.value, 2),
          i = _step4$value[0],
          frag = _step4$value[1];

      msg.msg.DATA = frag;
      msg.msg.FRAG_ID = msg.msg.FRAG_ID++;
      TO_SEND_BUFF.push(msg);
      sendToSerial();
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
        _iterator4["return"]();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }
}

function sendSingle(dataStr, dest, _id, FLAG) {
  msg = {
    retires: 0,
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
      TOB: convertDstAddr(dest)[1]
    }
  };
  console.log("sending to serial", msg);
  TO_SEND_BUFF.push(msg);
  sendToSerial();
}

function sendData(data, dest, _id) {
  dataStr = JSON.stringify(data);
  console.log("send", data, "to ", dest, "len", dataStr.length);

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
  console.log(_typeof(dst));
  var lenA = dst.length - 5;
  toA = parseInt(dst.slice(0, lenA));
  toB = parseInt(dst.slice(-5));
  return [toA, toB];
}

function chunkSubstr(str, size) {
  var numChunks = Math.ceil(str.length / size);
  var chunks = new Array(numChunks);

  for (var i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }

  return chunks;
}

function initNodeList() {
  NodeSchema_list.find({}, {
    nodeID: 1,
    _id: 0
  }, function (err, result) {
    console.log("data from node schema", result);
    if (err) throw err;
    var NODE_LIST = [];
    result.map(function (_ref2) {
      var nodeID = _ref2.nodeID;
      return nodeID;
    }).forEach(function (element) {
      NODE_LIST.push(element);
    });
    NODE_LIST.forEach(function (key) {
      console.log(key);
      ALL_NODE[key] = {
        status: "OFFLINE"
      };
    });
    console.log("NODE LIST", NODE_LIST);
    console.log("ALL NODE", ALL_NODE);
  });
  NodeSchema_list.find({
    isServer: true
  }, function (err, result) {
    if (err) throw err;
    SERVER_LIST = result;
    console.log("Server lists: ", SERVER_LIST);

    for (var server in SERVER_LIST) {
      console.log(server);
      ALL_SERVER[SERVER_LIST[server].nodeID] = {
        status: "OFFLINE",
        name: SERVER_LIST[server].nodeName
      };
    }

    console.log("SERVER LIST", SERVER_LIST);
    console.log("ALL SERVER", ALL_SERVER);
  });
}