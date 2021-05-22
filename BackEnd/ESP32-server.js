var config = require("./config");
var helperFx = require("./helper")

var SerialPort = require("serialport");
const ReadLine = require("@serialport/parser-readline");
const { BURST } = require("./config");
const PORT = new SerialPort(config.SERIAL_PORT, { baudRate: config.BUADRATE });
const parser = PORT.pipe(new ReadLine({ delimiter: "\n" }));
const winston = require('winston')
const fs = require('fs')
const path_log = './debug_log'
if(!fs.existsSync(path_log)){
  fs.mkdirSync(path_log)
}
const serialLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.File({ filename: `${path_log}/serialLog.json` }),
    ],
});

const msgLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.File({ filename: `${path_log}/msgLog.json` }),
    ],
});

const inMsgLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.File({ filename: `${path_log}/inMsgLog.json` }),
    ],
});

const nodeLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.File({ filename: `${path_log}/nodeLog.json` }),
    ],
});

const connectionLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.File({ filename: `${path_log}/connectionLog.json` }),
    ],
});

PORT.on("open", () => {
  console.info("serial port open");
});

parser.on("data", (data) => {
    try {
      if (data.search("CONNECTION") != -1) {
          connectionLogger.log('info',{T:Date.now(), DT: helperFx.time_el(T_ST), msg: data})
          // console.log(helperFx.time_el(T_ST),data)
      } else {
          const dataJSON = JSON.parse(data);
          serialLogger.log('info',{T:Date.now(), DT: helperFx.time_el(T_ST), IO: "IN", FLAG: dataJSON.F, HEADERS: dataJSON.H, PHYSLEN: data.length, RAW_DATA: data})
          serialHandler(dataJSON);
      }    
    } catch (err) {
      if (data.search("CONNECTION") != -1) {
          // console.log(helperFx.time_el(T_ST),data)
      }
      else {
          console.error("not parseable", data, err.name, err.message);
      } 
    }
});

// helperFx.test();
let SERIAL_ONLINE = false;
let T_ST = Date.now()

let BLT = config.BURST;
let MSG_ID = 0;
let SELF_ID = config.SELF_ID;
console.log(helperFx.time_el(T_ST),"INIT from config", SELF_ID);

let TS_BUFF = []
let S_BUFF = []
let RECV_BUFF = {}

let ALL_NODE = {}
let TOPOLOGY = {}

let sendSerialInterval = null;
let timedoutRoutine = null;

initNodeList()

function initNodeList() {
    NodeSchema_list.find({}, (err, result) => {
        if (err) throw err;
        NODE_LIST = result;
        console.log("Server lists: ", NODE_LIST);
        for (var node in NODE_LIST) {
            ALL_NODE[NODE_LIST[node].nodeID] = {
                status: "OFFLINE",
                isServer: NODE_LIST[node].isServer,
                name: NODE_LIST[node].nodeName,
                hop: -1,
                path: ""
            }

            nodeLogger.log('info',{T:Date.now(), DT: helperFx.time_el(T_ST), SRC: "INIT", data: ALL_NODE[NODE_LIST[node].nodeID]})
            
            if (NODE_LIST[node].isServer) {
                if (!(NODE_LIST[node].nodeID in RECV_BUFF)) {
                    console.log("created receive buffer for", NODE_LIST[node].nodeID)
                    RECV_BUFF[String(NODE_LIST[node].nodeID)] = {};
                }
            }
        }

        console.log("NODE LIST", NODE_LIST);
    });

    for (var node in ALL_NODE) {
        echoServer(node)
    }

}

function INIT(f_init) {
    if (SELF_ID != f_init.D) {
        console.log(helperFx.time_el(T_ST),"INIT from serial", f_init.D)
        SELF_ID = f_init.D
    }
    else {
        console.log(helperFx.time_el(T_ST),"alerady initialized")
    }

    if (!SERIAL_ONLINE) {
        SERIAL_ONLINE = true
        console.log(helperFx.time_el(T_ST),"SERIAL is online")
    }
}

function READY(f_ready) {
    console.log(f_ready)
    if (f_ready.D == 0) {
        recentSend = S_BUFF.pop()

        T_ERROR = Date.now()
        msgLogger.log('info',{T: T_ERROR, DT: helperFx.time_el(T_ST), TYPE: "NO ROUTE", T_ERR: T_ERROR, msg: recentSend, dT_ERR: T_ERROR-msg.T_SEND})

        console.error("NO ROUTE for MSG", recentSend.H.ID, "TO", recentSend.DST)

        //set server status to offline
        ALL_NODE[recentSend.DST].status = "OFFLINE"
        ALL_NODE[recentSend.DST].hop = -1
        ALL_NODE[recentSend.DST].path = ""
        
        io.to(present_room_id).emit("msg_room", {
          msg: `"notice: server",${recentSend.DST},${ALL_NODE[recentSend.DST].name} went offline`,
          date: new moment().format("DD/MM/YYYY HH:mm:ss"),
          room: present_room_id,
        });

        console.log(helperFx.time_el(T_ST),"notice: server",recentSend.DST,ALL_NODE[recentSend.DST].name,"went offline")
        nodeLogger.log('info',{T: T_ERROR, DT: helperFx.time_el(T_ST), SRC: "READY", data: ALL_NODE[recentSend.DST]})

        recentSend.ER_COUNT += 1
        //Retry this message
        TS_BUFF.push(recentSend)
        
        if(TS_BUFF.length > 0) {
            setSerialRoutine("READY")
        }

    } else {
        console.log(helperFx.time_el(T_ST), "ESP is ready")
        if(TS_BUFF.length > 0) {
          setSerialRoutine("READY")
      }
    }
}

function ECHO(f_echo) {
   if (f_echo.H.FR in ALL_NODE) {
        if (f_echo.D != ALL_NODE[f_echo.H.FR].name) {

            console.log(helperFx.time_el(T_ST),"Server", ALL_NODE[f_echo.H.FR].name, "changes name to", f_echo.D)
            
            NodeSchema_list.updateOne(
                { nodeID: f_echo.H.FR },
                {
                isServer: true,
                nodeName: f_echo.D,
                },
                (err, result) => {
                if (err) throw err;
                console.log(result);
                }
            );
        }
        if (ALL_NODE[f_echo.H.FR].status === "OFFLINE") {
            ALL_NODE[f_echo.H.FR].status = "ONLINE";

            console.log(helperFx.time_el(T_ST),"Server", ALL_NODE[f_echo.H.FR].name, "back online")
            nodeLogger.log('info',{T:Date.now(), DT: helperFx.time_el(T_ST), SRC: "ECHO", data: ALL_NODE[f_echo.H.FR]})

            io.to(present_room_id).emit("msg_room", {
              msg: `"notice: server"${ALL_NODE[f_echo.H.FR].name} back online`,
              date: new moment().format("DD/MM/YYYY HH:mm:ss"),
              room: present_room_id,
            });

            ALL_NODE[f_echo.H.FR].hop = helperFx.calcHop(f_echo.H.FR, TOPOLOGY)
            ALL_NODE[f_echo.H.FR].path = helperFx.routingPath(f_echo.H.FR, TOPOLOGY)
            RECV_BUFF[String(f_data.H.FR)] = {}

        }
        
   } else {
       try {
            ALL_NODE[f_echo.H.FR] = {
                status: "ONLINE",
                name: f_echo.D,
                isServer: true,
                hop: helperFx.calcHop(f_echo.H.FR, TOPOLOGY),
                path: helperFx.routingPath(f_echo.H.FR, TOPOLOGY)
            };
       } catch (err) {
            console.log('error when calculating hop for', f_echo, TOPOLOGY)
       }

        console.log(helperFx.time_el(T_ST),"added new server", ALL_NODE[f_echo.H.FR].name);
        nodeLogger.log('info',{T:Date.now(), DT: helperFx.time_el(T_ST), SRC: "ECHO", data: ALL_NODE[f_echo.H.FR]})

        io.to(present_room_id).emit("msg_room", {
          msg: `"added new server"${ALL_NODE[f_echo.H.FR].name} `,
          date: new moment().format("DD/MM/YYYY HH:mm:ss"),
          room: present_room_id,
        });

        if (!(f_echo.H.FR in RECV_BUFF)) {
            RECV_BUFF[String(f_echo.H.FR)] = {};
        }

        NodeSchema_list.updateOne(
            { nodeID: f_echo.H.FR },
            {
              isServer: true,
              nodeName: f_echo.D,
            },
            (err, result) => {
              if (err) throw err;
              console.log(helperFx.time_el(T_ST),result);
            }
        );
   }
}

function DATA(f_data) {
    // console.log("file Data:", f_data.D);
    if (f_data.H.FID == -1) {
        console.log(helperFx.time_el(T_ST),"RECEIVED", f_data.H.ID)
        for (i in f_data.D) {
            handleFrontendFrame(f_data.D[i])
        }
    } else {
        if (String(f_data.H.ID) in RECV_BUFF[String(f_data.H.FR)]) {
            RECV_BUFF[String(f_data.H.FR)][String(f_data.H.ID)][String(f_data.H.FID)] = f_data

            console.log("recv fragmented data:", f_data.H)
            console.log("total fragmented received", Object.keys(RECV_BUFF[String(f_data.H.FR)][String(f_data.H.ID)]).length)
            if (Object.keys(RECV_BUFF[String(f_data.H.FR)][String(f_data.H.ID)]).length == f_data.H.FL) {
                console.log(helperFx.time_el(T_ST), "All fragmented message of ", f_data.H.ID, "received")
                dataFull = "";
                try {
                    for (index = 0; index < f_data.H.FL; index++) {
                      // console.log("Data recv_buff:",RECV_BUFF[String(f_data.H.FR)][String(f_data.H.ID)][String(index)])
                        dataFull = dataFull.concat(RECV_BUFF[String(f_data.H.FR)][String(f_data.H.ID)][String(index)].D)
                    }
                    console.log("data from dataFull:", dataFull)
                } catch (err) {
                    console.log("ERROR when trying to reconstruct fragemnted message", err)
                }
                
                console.log(helperFx.time_el(T_ST),"RECEIVED-FRAG", f_data.H.ID)

                handleFrontendFrame(dataFull)
                delete RECV_BUFF[String(f_data.H.FR)][String(f_data.H.ID)]
            }

          } else {
            console.log("recv first fragmented data:", f_data.H)
            RECV_BUFF[String(f_data.H.FR)][String(f_data.H.ID)] = {};
            RECV_BUFF[String(f_data.H.FR)][String(f_data.H.ID)][String(f_data.H.FID)] = f_data
            console.log("total fragmented received", Object.keys(RECV_BUFF[String(f_data.H.FR)][String(f_data.H.ID)]).length)

          }
    }

}

function CHANGE(f_change) {
    if (!SERIAL_ONLINE) {
        SERIAL_ONLINE = true
        console.log(helperFx.time_el(T_ST),"SERIAL is online")
    }

    NODE_LIST = f_change.D.NL.split(",");
    NODE_LIST.splice(NODE_LIST.indexOf(SELF_ID),1)

    TOPOLOGY = JSON.parse(f_change.D.TP);

    console.log(helperFx.time_el(T_ST),'TOPOLOGY CHANGED:', f_change.D.TP)
    for (var key in ALL_NODE) {
        if (NODE_LIST.indexOf(key) >= 0) {
            if (ALL_NODE[key].status === "OFFLINE"){
                
                ALL_NODE[key].status = "ONLINE"

                if (ALL_NODE[key].isServer) {
                    console.log(helperFx.time_el(T_ST),"notice: server", key, ALL_NODE[key].name, "back online");

                    io.to(present_room_id).emit("msg_room", {
                        msg: `"notice: server",${key},${ALL_NODE[key].name} back online`,
                        date: new moment().format("DD/MM/YYYY HH:mm:ss"),
                        room: present_room_id,
                    });
                } else {
                    console.log(helperFx.time_el(T_ST),"notice: node", key, "back online");

                    io.to(present_room_id).emit("msg_room", {
                      msg: `"notice: node",${key} back online`,
                      date: new moment().format("DD/MM/YYYY HH:mm:ss"),
                      room: present_room_id,
                    });
                }

                //recalculate hop & path
                try {
                    ALL_NODE[key].hop = helperFx.calcHop(key, TOPOLOGY)
                    ALL_NODE[key].path = helperFx.routingPath(key, TOPOLOGY)
                } catch (err) {
                    if (ALL_NODE[key].isServer) {
                        console.log(helperFx.time_el(T_ST),"error,",err.name, err.message,",when calculating network hop for server", key, ALL_NODE[key].name, "TOPOLOGY", TOPOLOGY)
                    } else {
                        console.log(helperFx.time_el(T_ST),"error,",err.name, err.message,",when calculating network hop for node", key, "TOPOLOGY", TOPOLOGY)
                    }

                }
                
                nodeLogger.log('info',{T:Date.now(), DT: helperFx.time_el(T_ST), SRC: "CHANGE", data: ALL_NODE[key]})

                setSerialRoutine("CHANGE");

            }
            //remove the updated one
            NODE_LIST.splice(NODE_LIST.indexOf(key), 1);

        } else {
            if (ALL_NODE[key].status === "ONLINE") {

                ALL_NODE[key].status = "OFFLINE"
                ALL_NODE[key].hop = -1
                ALL_NODE[key].path = ""

                nodeLogger.log('info',{T:Date.now(), DT: helperFx.time_el(T_ST), SRC: "CHANGE", data: ALL_NODE[key]})

                if (ALL_NODE[key].isServer) {
                    console.log(helperFx.time_el(T_ST),"notice: server",key,ALL_NODE[key].name,"went offline")
                    
                    io.to(present_room_id).emit("msg_room", {
                        msg: `"notice: server",${key},${ALL_NODE[key].name} went offline`,
                        date: new moment().format("DD/MM/YYYY HH:mm:ss"),
                        room: present_room_id,
                      });
                } else {
                    console.log(helperFx.time_el(T_ST),"notice: node", key, "went offline")

                    io.to(present_room_id).emit("msg_room", {
                        msg: `"notice: node",${key} went offline`,
                        date: new moment().format("DD/MM/YYYY HH:mm:ss"),
                        room: present_room_id,
                    });
                }
            }

            NODE_LIST.splice(NODE_LIST.indexOf(key), 1);
        }
    }
    
    // add new node to database
    NODE_LIST.forEach((item, index) => {
        console.log(helperFx.time_el(T_ST),"NEW NODE", item, "ONLINE");

        try {
            ALL_NODE[item] = {
                status: "ONLINE",
                isServer: false,
                name: "",
                hop: helperFx.calcHop(item,TOPOLOGY),
                path: helperFx.routingPath(item, TOPOLOGY)
            }
            
            nodeLogger.log('info',{T:Date.now(), DT: helperFx.time_el(T_ST), SRC: "CHANGE", node: key, data: ALL_NODE[key]})

            let new_node = new NodeSchema_list({
                nodeID: item,
                isServer: false,
                nodeName: "",
              });
              new_node.save((err, result) => {
                if (err) throw err;
                console.log(helperFx.time_el(T_ST),result);
            });
        } catch (err) {
            console.log(helperFx.time_el(T_ST),"error,",err.name, err.message,",when calculating network hop for new node", item, "TOPOLOGY", TOPOLOGY);
        }
        echoServer(item);
    })

    console.log(ALL_NODE)
}

function ACK(f_ack) {

    let ACK_RE_TIME = Date.now();
    found = false;
            
    for (let [i,msg] of S_BUFF.entries()) {
        //for non fragmented messages
        if (f_ack.H.ID == msg.msg.H.ID && f_ack.H.FID == -1) {

            console.log(helperFx.time_el(T_ST), "ACK", f_ack.H, "DST", msg.DST, "RTT", ACK_RE_TIME-msg.T_SEND)
            msgLogger.log('info',{T: ACK_RE_TIME, DT: helperFx.time_el(T_ST), TYPE: "ACK", T_ACK: ACK_RE_TIME, msg: msg, RTT: ACK_RE_TIME-msg.T_SEND})

            S_BUFF.splice(i,1);

            for (j in msg.id){
                updateSynced(msg.FFLAG[j], msg.id[j], msg.DST)
            }

            found = true
            break
        }

        else if (f_ack.H.ID == msg.msg.H.ID && f_ack.H.FID == msg.msg.H.FID) {
            console.log(helperFx.time_el(T_ST), "ACK", f_ack.H, "DST", msg.DST, "RTT", ACK_RE_TIME-msg.T_SEND)
            msgLogger.log('info',{T: ACK_RE_TIME, DT: helperFx.time_el(T_ST), TYPE: "ACK", T_ACK: ACK_RE_TIME, msg: msg, RTT: ACK_RE_TIME-msg.T_SEND})

            fragCount = 0
            for (let [j,mssg] of S_BUFF.entries()) {
                if (f_ack.H.ID == mssg.msg.H.ID) {
                    fragCount += 1
                }
            }
            for (let [j,mssg] of TS_BUFF.entries()) {
              if (f_ack.H.ID == mssg.msg.H.ID) {
                  fragCount += 1
              }
          }
            
            console.log("from ACK fx: remaining frag is: ", fragCount)
            if(fragCount == 1) {
                console.log("update frontend of fragment", msg.msg.H)
                updateSynced(msg.FFLAG, msg.ID, msg.DST)
            }
            S_BUFF.splice(i,1)
            found = true
            break
        }
    }

    if(!found) {
        console.log(helperFx.time_el(T_ST),"ACK DELAYED", f_ack.H);
    }
}

function sendFragment(dataStr, dest, _id, FFLAG) {
    dataFrag = helperFx.chunkSubstr(dataStr, config.FRAGMTU)
    
    msg = {
        T_SEND: 0,
        ER_COUNT: 0,
        DST: dest,
        PHYS_LEN: 0,
        id: _id,
        FFLAG: FFLAG,
        msg: {
            F: 4,
            H: {
                ID: nextMSG_ID(),
                FID: -1,
                FL: dataFrag.length,
                AG: 1,
                DA: helperFx.convertDstAddr(dest)[0],
                DB: helperFx.convertDstAddr(dest)[1]
            },
            D: ""
        }
    }

    console.log("this message will be fragmented into", dataFrag.length, "pieces")
    console.log("TS_buff initial len", TS_BUFF.length)

    for (let [i, frag] of dataFrag.entries()) {
        // console.log("type of frag", typeof(frag), frag )
        msg.msg.D = frag,
        msg.msg.H.FID += 1;

        msg.PHYS_LEN = JSON.stringify(msg.msg).length
        TS_BUFF.push(JSON.parse(JSON.stringify(msg)))

        setSerialRoutine("SEND - FRAG")
    }
    console.log("TS_buff final len", TS_BUFF.length)
    for(let [i,msg] of TS_BUFF.entries()) {
      console.log("add sendfrag res",msg.msg.H)
    }
}

function sendSingle(dataStr, dest, _id, FFLAG) {
    msg = {
        T_SEND: 0,
        ER_COUNT: 0,
        DST: dest,
        PHYS_LEN: 0,
        id: [_id],
        FFLAG: [FFLAG],
        AGGED: [],
        msg: {
            F: 4,
            H: {
                ID: nextMSG_ID(),
                FID: -1,
                FL: -1,
                AG: 1,
                DA: helperFx.convertDstAddr(dest)[0],
                DB: helperFx.convertDstAddr(dest)[1]
            },
            D: [dataStr]
        }
    }
    msg.AGGED.push(msg.msg.H.ID)
    msg.PHYS_LEN = JSON.stringify(msg.msg).length
    TS_BUFF.push(msg)
    setSerialRoutine("SEND - SINGLE")
}

function sendData(data, dest, _id) {
  console.log("data:", data, "to:", dest, "id",_id)
    dataStr = JSON.stringify(data)
    // console.log(dataStr.length, config.NONFRAGMTU)
    if (dataStr.length > config.NONFRAGMTU) {
        if (dest === "ALL") {
            for (var server in ALL_NODE) {
                if(server.isServer){
                    console.log(helperFx.time_el(T_ST),"will fragment send to", server);
                    sendFragment(dataStr, server, _id, data.FLAG);
                }   
            }
        } else {
            console.log(helperFx.time_el(T_ST),"will specifically fragment send to", server);
            sendFragment(dataStr, dest, _id, data.FLAG);
        }
    } else {
        if (dest === "ALL") {
            for (var server in ALL_NODE) {
                if(server.isServer){
                    console.log(helperFx.time_el(T_ST),"will send to", server, ALL_NODE[server]);
                    sendSingle(dataStr, server, _id, data.FLAG);
                }     
            }
        } else {
            console.log(helperFx.time_el(T_ST),"will specifically send to", server);
            sendSingle(dataStr, dest, _id, data.FLAG);
        }
    }
}

function setSerialRoutine(issuer) {
    if (sendSerialInterval == null && TS_BUFF.length > 0) {
        console.log("received set serial routine from", issuer, "and set send to serial routine", "in queue",TS_BUFF.length)
        sendSerialInterval = setTimeout(sendToSerial, Math.random() * config.DELAY_MAX + config.DELAY_MIN)
        // if (BLT == 0) {
        //     BLT = config.BURST
        //     sendSerialInterval = setTimeout(sendToSerial, Math.random() * config.DELAY_MAX + config.DELAY_MIN)
        // }
        // else {
        //     sendSerialInterval = setTimeout(sendToSerial, Math.random() * config.DELAY_MIN)
        //     BLT -= 1
        // }
    } else {
        console.log("received set serial routine from", issuer, "and do nothing","in queue",TS_BUFF.length)
    }
}

function sendToSerial() {
    let msgToSend = null;
    if (TS_BUFF.length > 0) {
        try{
          msgToSend = pickNextMSG()
          console.log("the message to serial", msgToSend)
        }
        catch(err){
          console.error(err)
        }
        if (msgToSend != null && typeof(msgToSend) != 'undefined') {
            console.log(helperFx.time_el(T_ST),"sending", msgToSend.msg.F, "ID:", msgToSend.msg.H.ID)
            console.log("Physical length: ",JSON.stringify(msgToSend.msg).length)

            PORT.write(JSON.stringify(msgToSend.msg))
            msgToSend.T_SEND = Date.now();
            S_BUFF.push(msgToSend);

            serialLogger.log('info',{T:msgToSend.T_SEND, DT: helperFx.time_el(T_ST), IO: "OUT", FLAG: msgToSend.msg.F ,HEADERS: msgToSend.msg.H, PHYSLEN: msgToSend.PHYS_LEN, RAW_DATA: JSON.stringify(msgToSend.msg)})
            
            if (timedoutRoutine == null) {
                timedoutRoutine = setInterval(msgTimeout, 500);
            }
              sendSerialInterval = null;
        } else {
            console.log(helperFx.time_el(T_ST), "all server is offline nothing to send", TS_BUFF.length, 'msgs in queue');
            sendSerialInterval = null;
        }
    } else {
        console.log(helperFx.time_el(T_ST),"nothing to send")
        sendSerialInterval = null;
    }
}

function serialHandler(data){
    // console.log("incoming data:", data)
    inMsgLogger.log('info',{T:Date.now(), data: data})
    
    switch(data.F){
        case 0: INIT(data); break;
        case 1: READY(data); break;
        case 2: CHANGE(data); break;
        case 3: ECHO(data); break;
        case 4: DATA(data); break;
        case 5: ACK(data); break;
    }
}

function pickNextMSG() {
    let pickedMsg = null
    let shiftCount = 0

    while (true) {
        shiftCount += 1

        if (TS_BUFF.length == 0) {
            console.log("to send buffer is empty")
            return null
        }

        let selectedMsg = TS_BUFF[0]
        // console.log("selected MSG:",TS_BUFF[0], "length: ", TS_BUFF.length)
        // console.log("message:",selectedMsg.DST,"status:",ALL_NODE[selectedMsg.DST].status)
        try {
            if (selectedMsg.msg.F == 3 && ALL_NODE[selectedMsg.DST].status === "ONLINE") {
                pickedMsg = selectedMsg
                // console.log("from if cond:", pickedMsg)
                TS_BUFF.splice(0,1)
                return pickedMsg
            } else if (ALL_NODE[selectedMsg.DST].status === "ONLINE") {
                pickedMsg = selectedMsg
                // console.log("from else if cond:", pickedMsg)
                TS_BUFF.splice(0,1);
                if (selectedMsg.msg.H.FID != -1 || selectedMsg.msg.H.AG != 1){
                    return pickedMsg
                }
                break;
            } else {
                // console.log("from else cond:", pickedMsg)
                TS_BUFF.push(selectedMsg);
                TS_BUFF.splice(0,1);
                if (shiftCount == TS_BUFF.length) {
                    break;
                }
            }
        } catch (err) {
            console.log(helperFx.time_el(T_ST),"error when trying to pick message", err)
            break;
        }
    }

    if (pickedMsg == null) {
        console.log(helperFx.time_el(T_ST), "no message candidate");
        return pickedMsg
    }

    totalMsgLen = JSON.stringify(pickedMsg.msg.D).length;
    console.log(helperFx.time_el(T_ST), "begin agg with phys len:", totalMsgLen)

    while (totalMsgLen < config.MTU) {
        nextCandidate = null
        
        for (i in TS_BUFF) {
            if (TS_BUFF[i].msg.F != 3 && TS_BUFF[i].DST == pickedMsg.DST && TS_BUFF[i].msg.H.FID == -1 && TS_BUFF[i].msg.H.AG == 1) {
                nextCandidate = i
                console.log(helperFx.time_el(T_ST), "trying to agg", TS_BUFF[nextCandidate].msg.H.ID, "to", pickedMsg.msg.H.ID, "ori len", totalMsgLen)
                break
            }
        }

        if (nextCandidate == null) {
            console.log(helperFx.time_el(T_ST), 'agg stopped there is no suitable candidate')
            break
        } else if (totalMsgLen + TS_BUFF[nextCandidate].msg.D[0].length + 3 > config.NONFRAGMTU) {
            console.log(helperFx.time_el(T_ST), "agg stopped result will exceed MTU")
            break
        } else {
            pickedMsg.id.push(TS_BUFF[nextCandidate].id[0])
            pickedMsg.msg.H.AG += 1

            pickedMsg.AGGED.push(TS_BUFF[nextCandidate].msg.H.ID)
            pickedMsg.msg.D.push(TS_BUFF[nextCandidate].msg.D[0])
            pickedMsg.FFLAG.push(TS_BUFF[nextCandidate].FFLAG[0])

            totalMsgLen += (TS_BUFF[nextCandidate].msg.D[0].length + 3)
            console.log(helperFx.time_el(T_ST), "agged", TS_BUFF[nextCandidate].msg.H.ID, "to", pickedMsg.msg.H.ID, "new data length", totalMsgLen , totalMsgLen/config.NONFRAGMTU * 100)
            
            pickedMsg.PHYS_LEN = JSON.stringify(pickedMsg.msg).length
            TS_BUFF.splice(nextCandidate, 1);
        }
    }

    console.log("agg final phys len", pickedMsg.PHYS_LEN, "AGGED", pickedMsg.AGGED)
    return pickedMsg
}

function nextMSG_ID() {
    if (MSG_ID == 999) {
        MSG_ID = 0;
        return MSG_ID;
      } else {
        return MSG_ID++;
      }
}

function updateSynced(FFLAG, id, dst){
    if (FFLAG === "msg") {
        var chatModel = mongoose.model("ChatSchemaList", ChatSchema);
        chatModel.updateOne(
            { _id: id },
            {
            $push: {
                synced: dst,
            },
            },
            (err, result) => {
                if (err) throw err;
                console.log(helperFx.time_el(T_ST),"updated chat db after synced", result);
            }
        );
    } else if (FFLAG === "room") {
        var roomModel = mongoose.model("RoomSchemaList", RoomSchema);
        roomModel.updateOne(
            { _id: id },
            {
            $push: {
                synced: dst,
            },
            },
            (err, result) => {
                if (err) throw err;
                console.log(helperFx.time_el(T_ST),"updated room db after synced", result);
            }
        );
    } else if (FFLAG === "user") {
        var userModel = mongoose.model("UserSchemaList", userRegister);
        userModel.updateOne(
            { _id: id },
            {
            $push: {
                synced: dst,
            },
            },
            (err, result) => {
                if (err) throw err;
                console.log(helperFx.time_el(T_ST),"updated user db after synced", result);
            }
        );
    }
}

function echoServer(dest) {
    msg = {
        T_SEND: 0,
        ER_COUNT: 0,
        DST: dest,
        PHYS_LEN: 0,
        msg: {
            F: 3,
            H: {
                ID: nextMSG_ID(),
                FID: 0,
                FL: 0,
                AG: 1,
                DA: helperFx.convertDstAddr(dest)[0],
                DB: helperFx.convertDstAddr(dest)[1]
            },
            D: config.SERVER_NAME
        }
    };

    msg.PHYS_LEN = JSON.stringify(msg.msg).length


    TS_BUFF.push(msg);
    setSerialRoutine("ECHO - SERVER");
}

function handleFrontendFrame(data) {
  console.log(data)
  try {
    extract_json_obj = JSON.parse(data);
    console.log("Data from Json Obj:",JSON.parse(data))
  } catch (error) {
    console.error("parsing Data error:",error, data)
  }


  if (extract_json_obj.FLAG === "msg"){
        
      let message = mongoose.model(present_room_id, ChatSchema);
      let u_name_in_chat = extract_json_obj.username;
      let msg_in_chat = extract_json_obj.msg;
      let date_in_chat = extract_json_obj.date;
      let room_in_chat = extract_json_obj.room;
      let file_in_chat = extract_json_obj.data
      console.log("File in chat:",file_in_chat)
      if (room_in_chat !== present_room_id) {
        console.log("Room name:",room_in_chat)
        console.log(helperFx.time_el(T_ST),"mismatch room");
        console.log(helperFx.time_el(T_ST),`user is: ${u_name_in_chat} msg is: ${msg_in_chat}
        date is: ${date_in_chat} room is: ${room_in_chat} `);
        let message = mongoose.model(room_in_chat, ChatSchema);
        if(file_in_chat){
          console.log("incomming msg have file upload and mismatch room")
          let save_msg = new message({
            username: u_name_in_chat,
            msg: msg_in_chat,
            data:{data: file_in_chat.data,
                  name: file_in_chat.name,
                  contentType: file_in_chat.contentType},
            room: room_in_chat,
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
          console.log("incomming msg no file upload and mismatch room")
          let save_msg = new message({
            username: u_name_in_chat,
            msg: msg_in_chat,
            date: date_in_chat,
            room: room_in_chat,
          });
          save_msg.save((err, result) => {
            if (err) throw err;
            msg_room_2.push(result);
            io.to(room_in_chat).emit("msg_room", result);
          });
        }
      } 
      else {
        console.log("Room name:",present_room_id)
        if(file_in_chat){
          console.log("incomming msg have file upload and correct room")
          let save_msg = new message({
            username: u_name_in_chat,
            msg: msg_in_chat,
            data:{data: file_in_chat.data,
                  name: file_in_chat.name,
                  contentType: file_in_chat.contentType},
            room: present_room_id,
            date: date_in_chat,
          });
          save_msg.save((err, result) => {
            if (err) throw err;
            msg_room_2.push(result);
            io.to(present_room_id).emit("msg_room", result);
          });
        }
        else{
          console.log("incomming msg no file upload and correct room")
          let save_msg = new message({
            username: u_name_in_chat,
            msg: msg_in_chat,
            date: date_in_chat,
            room: present_room_id,
          });
          save_msg.save((err, result) => {
            if (err) throw err;
            msg_room_2.push(result);
            io.to(present_room_id).emit("msg_room", result);
          });
        }
      }
  }
  if (extract_json_obj.FLAG === "room"){
    let data_in_create_room = extract_json_obj.msg
    let regex = data_in_create_room.replace("Welcome to ", "")
        let new_room = mongoose.model(regex, ChatSchema);
        let data_room = new new_room({
          username: "Admin",
          msg: data_in_create_room,
          date: new moment().format("DD/MM/YYYY HH:mm:ss"),
        });
        let room = new room_list({
          RoomID: regex,
        });
        room.save(regex);
        data_room.save((err, result) => {
          if (err) throw err;
          console.log(result);
        });
  }
  if (extract_json_obj.FLAG === "user"){
    let username_in_create_room = extract_json_obj.registername
        let password_in_create_room = extract_json_obj.password
        let Data = new userDataModel({
          registername: username_in_create_room,
          password: password_in_create_room,
        });
        console.log(`Register Sucessfully!`);
        Data.save((err, result) => {
          if (err) throw err;
          console.log(result)
        });
  }
}

function msgTimeout() {
    if (!S_BUFF) {
        clearInterval(timedoutRoutine)
        timedoutRoutine = null
    } else {
        toSplice = []

        for (let [i,msg] of S_BUFF.entries()) {
            if (msg.msg.F === 3) {
                toSplice.push(i)
            } else if (Date.now() - msg.T_SEND >= config.TIMEOUT[ALL_NODE[msg.DST].hop]) {

                currentTime = Date.now()
                var timedoutMsg = msg;
                
                timedoutMsg.ER_COUNT += 1

                console.log(helperFx.time_el(T_ST), "TIMEDOUT", timedoutMsg.msg.H, "at", (currentTime - msg.T_SEND) / 1000,"sec")

                msgLogger.log('info',{T: currentTime, DT: helperFx.time_el(T_ST), TYPE: "TIMEOUT", T_TOUT: currentTime, msg: timedoutMsg, dT_TOUT: currentTime-timedoutMsg.T_SEND})

                toSplice.push(i)
                TS_BUFF.push(timedoutMsg)
                setSerialRoutine("timeout function");
            }
        }

        toSplice.forEach((item, index) => {
            S_BUFF.splice(item,1)
          })
    }
}