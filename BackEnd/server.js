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
let nameinchat = [];
const passwd = [];
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
  socket.emit("loggedIn", {
    users: users.map((s) => s.username),
    messages: messages,
  });

  socket.on("newuser", (username) => {
    console.log(`${username} has join at the chat.`);
    socket.username = username;
    users.push(socket);
    io.emit("userOnline", socket.username);
  });

  socket.on("user_regis", (userdata, userpassword) => {
    let Data = new userDataModel({
      registername: userdata,
      password: userpassword,
    });
    console.log(`Username is ${Data.registername} Password is ${Data.password}`);
    Data.save((err,result) => {
      if (err) throw err;
      io.emit("regis_success", "Register Success!")
    })
  });

  socket.on("msg", (msg) => {
    console.log(`${socket.username} said '${msg}'`);

    let message = new chatModel({
      username: socket.username,
      msg: msg,
      date: new moment().format("DD/MM/YYYY HH:mm:ss"),
    });
    console.log("message is ", message);

    message.save((err, result) => {
      // console.log(err, result);
      if (err) throw err;

      // console.log(err);
      messages.push(result);
      io.emit("msg", result);
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`${socket.username} has left the chat.`);
    io.emit("userLeft", socket.username);
    users.splice(users.indexOf(socket), 1);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port %s", process.env.PORT || 3000);
});
