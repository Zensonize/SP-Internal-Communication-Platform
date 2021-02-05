"use strict";

var app = require("express")();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Option, Authorization");
  next();
});
app.get("/", function (req, res) {
  res.render("/", {
    tile: "Emergency Chat System V1.1"
  });
}); // Default is localhost:3000 or localhost:8080

var http = require("http").Server(app); // const io = require("socket.io")(3000);


var io = require("socket.io")(http); // const redis = require("socket.io-redis");
// io.adapter(redis({ host: "localhost", port: 6379 }));


var mongoose = require("mongoose");

var users = [];
var messages = [];
var msg_room_2 = [];
var room_lists = [];
var lists = [];
var present_room_id = "";

var moment = require("moment");

var _require = require("console"),
    error = _require.error;

moment.locale("th");
mongoose.connect("mongodb://localhost:27017/chat", {
  auth: {
    authSource: "admin"
  },
  user: "admin",
  pass: "sunat1998",
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
var chatschema = mongoose.Schema({
  username: String,
  msg: String,
  date: String
});
var RoomModel = mongoose.Schema({
  RoomID: String
});
var room_list = mongoose.model("room_list", RoomModel);
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
var userRegister = mongoose.Schema({
  registername: String,
  password: String
});
var userDataModel = mongoose.model("user_register", userRegister);
userDataModel.find(function (err, result) {
  if (err) throw err;
  nameinchat = result;
});
io.on("connection", function (socket) {
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
        var new_room = mongoose.model(data, chatschema);
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
    var custom_room = mongoose.model(present_room_id, chatschema);
    custom_room.find(function (err, result) {
      if (err) throw err;
      msg_room_2 = result;
    });
  });
  socket.on("msg", function (msg, room, user) {
    present_room_id = room;
    console.log("".concat(present_room_id, " active!"));
    console.log("".concat(socket.username, " said '").concat(msg, "'"));
    var message = mongoose.model(present_room_id, chatschema);
    var save_msg = new message({
      username: user,
      msg: msg,
      date: new moment().format("DD/MM/YYYY HH:mm:ss")
    });
    socket.join(room, function () {
      save_msg.save(function (err, result) {
        if (err) throw err;
        console.log(result);
        msg_room_2.push(result);
        io.to(room).emit("msg_room", result);
      });
    });
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
http.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", process.env.PORT || 3000);
});