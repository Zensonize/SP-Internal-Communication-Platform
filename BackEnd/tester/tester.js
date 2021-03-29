const io = require("socket.io-client");

var fs = require('fs');
var obj;
var u_name = []
var msg = []
var room = 'test'

// console.log(obj)


const socket = io("http://192.168.5.1:3000/", {
  reconnectionDelayMax: 10000,
  
});
socket.on("connect", () => {
    console.log("Client is connected to Server"); // "G5p5..."
    
  });

  fs.readFile('./dataSet.json', 'utf8', function (err, data) {
    if (err) throw err;
    obj = JSON.parse(data, (key,value) =>{

        
      if(key === "username"){
          // console.log("found")
          u_name.push(value)
      }
      if(key === "msg"){
          // console.log("found msg")
          msg.push(value)
      }
    });
  });

const timer = ms => new Promise(res => setTimeout(res, ms))

function random(min,max){
  return Math.floor(Math.random() * (max-min) + min);
}

async function load () { // We need to wrap the loop into an async function for this to work
  for (var i = 0; i < 1000; i++) {
    console.log(i);
    socket.emit("msg",msg[random(0,9999)],room,u_name[random(0,9999)])
    await timer(600); // then the created Promise can be awaited
    // console.log(random(0,9999))
    
  }
}

load()