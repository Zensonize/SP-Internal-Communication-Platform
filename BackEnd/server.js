var app = require("express")();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://192.168.1.43:3000");
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
// Default is localhost:3000 or localhost:8080
var http = require("http").Server(app);
var io = require("socket.io")(http);
var mongoose = require("mongoose");
let users = [];
let messages = [];
let msg_room_2 = [];
let msg_room_3 = [];
let msg_room_4 = [];
var present_room_id = "";
const moment = require("moment");
moment.locale("th");

mongoose.connect("mongodb://192.168.1.43:27017/chat", {
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
  console.log("mongoose is connected");
});

var chatschema = mongoose.Schema({
  username: String,
  msg: String,
  date: String,
});

var chatModel = mongoose.model("chat", chatschema);
chatModel.find((err, result) => {
  if (err) throw err;
  messages = result;
});

var general_room = mongoose.model("first", chatschema);
general_room.find((err, result) => {
  if (err) throw err;
  msg_room_2 = result;
  // console.log("msg from general room",messages2)
});

var private_room = mongoose.model("second", chatschema);
private_room.find((err, result) => {
  if (err) throw err;
  msg_room_3 = result;
});

var emergency_room = mongoose.model("third", chatschema);
emergency_room.find((err, result) => {
  if (err) throw err;
  msg_room_4 = result;
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
  if (present_room_id) {
    console.log("connecting to:", present_room_id);
  }

  if (present_room_id === "Firstroom") {
    socket.emit("loggedIn", {
      users: users.map((s) => s.username),
      messages: msg_room_2,
      room: present_room_id,
    });
  } else if (present_room_id === "Secondroom") {
    // console.log(msg_room_2)
    socket.emit("loggedIn", {
      users: users.map((s) => s.username),
      messages2: msg_room_3,
      room: present_room_id,
    });
  } else if (present_room_id === "Thirdroom") {
    socket.emit("loggedIn", {
      users: users.map((s) => s.username),
      messages3: msg_room_4,
      room: present_room_id,
    });
  }
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
        // console.log(result)
        if (result.length === 0) {
          console.log("Data not found");
          socket.emit("auth_fail", "Username or Password is wrong");
        } else {
          console.log("Found user data", result);
          socket.emit("auth_success", result);
        }
      }
    );
  });

  socket.on("msg", (msg, room) => {
    present_room_id = room;
    console.log(`${present_room_id} active!`);
    console.log(`${socket.username} said '${msg}'`);

    if (present_room_id === "Firstroom") {
      console.log(`send msg from ${present_room_id}!`);
      let message = new general_room({
        username: socket.username,
        msg: msg,
        date: new moment().format("DD/MM/YYYY HH:mm:ss"),
      });
      console.log("message is ", message);

      message.save((err, result) => {
        // console.log(err, result);
        if (err) throw err;

        // console.log(err);
        msg_room_2.push(result);
        io.emit("msg", result);
      });
    } else if (present_room_id === "Secondroom") {
      console.log(`send msg from ${present_room_id}!`);
      let message = new private_room({
        username: socket.username,
        msg: msg,
        date: new moment().format("DD/MM/YYYY HH:mm:ss"),
      });
      console.log("message is ", message);

      message.save((err, result) => {
        // console.log(err, result);
        if (err) throw err;

        // console.log(err);
        msg_room_3.push(result);
        io.emit("msg", result);
      });
    } else if (present_room_id === "Thirdroom") {
      let message = new emergency_room({
        username: socket.username,
        msg: msg,
        date: new moment().format("DD/MM/YYYY HH:mm:ss"),
      });
      console.log("message is ", message);

      message.save((err, result) => {
        // console.log(err, result);
        if (err) throw err;

        // console.log(err);
        msg_room_4.push(result);
        io.emit("msg", result);
      });
    }
    // let message = new chatModel({
    //   username: socket.username,
    //   msg: msg,
    //   date: new moment().format("DD/MM/YYYY HH:mm:ss"),
    // });
    // console.log("message is ", message);

    // message.save((err, result) => {
    //   // console.log(err, result);
    //   if (err) throw err;

    //   // console.log(err);
    //   messages.push(result);
    //   io.emit("msg", result);
    // });
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

http.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port %s", process.env.PORT || 3000);
});
