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


  fs.readFile('./MOCK_DATA_10000.json', 'utf8', function (err, data) {
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

async function load () { // We need to wrap the loop into an async function for this to work
  for (var i = 0; i < 50 ; i++) {
    console.log(i);
    socket.emit("msg",msg[i],room,u_name[i])
    await timer(500); // then the created Promise can be awaited
    
  }
}

socket.on("connect", () => {
  console.log("Client is connected to Server"); // "G5p5..."
  load();
});

