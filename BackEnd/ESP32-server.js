var config = require("./config");
var helperFx = require("./helper")

var SerialPort = require("serialport");
const ReadLine = require("@serialport/parser-readline");
const { BURST } = require("./config");
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
let ALL_SERVER = {}
let TOPOLOGY = {}

let sendSerialInterval = null;
let timedoutRoutine = null;

initNodeList()

function initNodeList() {
    NodeSchema_list.find({}, { nodeID: 1, _id: 0 }, (err, result) => {
        console.log(helperFx.time_el(T_ST),"data from node schema", result);
        if (err) throw err;
        var NODE_LIST = [];
        result
          .map(({ nodeID }) => nodeID)
          .forEach((element) => {
            NODE_LIST.push(element);
          });
    
        NODE_LIST.forEach((key) => {
          ALL_NODE[key] = {
            status: "OFFLINE",
            hop: -1,
          };
        });
        
        for (var node in ALL_NODE) {
            echoServer(node)
        }

        console.log(helperFx.time_el(T_ST),"NODE LIST from INIT", NODE_LIST);
        console.log(helperFx.time_el(T_ST),"ALL NODE from INIT", ALL_NODE);
      });
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
    if (f_ready.D == 0) {
        recentSend = S_BUFF.pop()
        console.error("NO ROUTE for MSG", recentSend.H.ID, "TO", recentSend.DST)

        //set server status to offline
        ALL_NODE[recentSend.DST].status = "OFFLINE"
        ALL_SERVER[recentSend.DST].status = "OFFLINE"
        io.to(present_room_id).emit("msg_room", {
          msg: `"notice: server",${recentSend.DST},${ALL_SERVER[recentSend.DST].name} went offline`,
          date: new moment().format("DD/MM/YYYY HH:mm:ss"),
          room: present_room_id,
        });
        console.log(helperFx.time_el(T_ST),"notice: server",recentSend.DST,ALL_SERVER[recentSend.DST].name,"went offline")

        recentSend.ER_COUNT += 1
        //Retry this message
        TS_BUFF.push(recentSend)
    } else {
        console.log(helperFx.time_el(T_ST), "ESP is ready")
    }

    if (TS_BUFF.length > 0) {
        sendSerialInterval = null
        setSerialRoutine()
    } else {
        sendSerialInterval = null
        BLT = config.BURST
    }
}

function ECHO(f_echo) {
   if (f_echo.H.FR in ALL_SERVER) {
        if (ALL_SERVER[f_echo.H.FR].status === "OFFLINE") {
            ALL_SERVER[f_echo.H.FR].status = "ONLINE";
            ALL_NODE[f_echo.H.FR].status = "ONLINE";

            console.log(helperFx.time_el(T_ST),"Server", ALL_SERVER[f_echo.H.FR].name, "back online")
            io.to(present_room_id).emit("msg_room", {
              msg: `"notice: server"${ALL_SERVER[recentSend.DST].name} back online`,
              date: new moment().format("DD/MM/YYYY HH:mm:ss"),
              room: present_room_id,
            });
            ALL_SERVER[f_echo.H.FR].hop = helperFx.calcHop(f_echo.H.FR, TOPOLOGY)
            ALL_NODE[f_echo.H.FR].hop = ALL_SERVER[f_echo.H.FR].hop
        }
        if (f_echo.D != ALL_SERVER[f_echo.H.FR].name) {
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
   } else {
        ALL_SERVER[f_echo.H.FR] = {};
        ALL_SERVER[f_echo.H.FR].name = f_echo.D;

        ALL_SERVER[f_echo.H.FR].status = "ONLINE";
        ALL_NODE[f_echo.H.FR].status = "ONLINE";

        console.log(helperFx.time_el(T_ST),"added new server", ALL_SERVER[f_echo.H.FR].name);

        ALL_SERVER[f_echo.H.FR].hop = helperFx.calcHop(f_echo.H.FR,TOPOLOGY);
        ALL_NODE[f_echo.H.FR].hop = ALL_SERVER[f_echo.H.FR].hop
        RECV_BUFF[f_echo.H.FR] = {};

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
    console.log("file Data:", f_data.D[0]);
    if (f_data.H.FID == -1) {
        console.log(helperFx.time_el(T_ST),"RECEIVED", f_data.H.ID)

        for (i in f_data.D) {
            handleFrontendFrame(f_data.D[i])
        }
    } else {
        if (f_data.H.ID in RECV_BUFF[f_data.H.FR]) {
            RECV_BUFF[f_data.H.FR][f_data.H.ID][f_data.H.FID] = f_data

            console.log("recv fragmented data:", f_data.H)

            if (RECV_BUFF[f_data.H.FR][f_data.H.ID].length == f_data.H.FL) {
                console.log(helperFx.time_el(T_ST), "All fragmented message of ", f_data.H.ID, "received")
                
                try {
                    dataFull = "";
                    for (index = 0; index < f_data.H.FL; index++) {
                        dataFull.concat(RECV_BUFF[f_data.H.FR][f_data.H.ID][index].D)
                    }
                    console.log("data from dataFull:", dataFull)
                } catch (err) {
                    console.log("ERRPR when trying to reconstruct fragemnted message", err)
                }
                
                console.log(helperFx.time_el(T_ST),"RECEIVED-FRAG", f_data.H.ID)

                handleFrontendFrame(dataFull)
                delete RECV_BUFF[f_data.H.FR][f_data.H.ID]
            }

          } else {
            RECV_BUFF[f_data.H.FR][f_data.H.ID] = {};
            RECV_BUFF[f_data.H.FR][f_data.H.ID][f_data.H.FID] = f_data
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
                if (key in ALL_SERVER) {
                    ALL_SERVER[key].status = "ONLINE";
                    ALL_NODE[key].status = "ONLINE";
                    console.log(helperFx.time_el(T_ST),"notice: server", key, ALL_SERVER[key].name, "back online");
                    io.to(present_room_id).emit("msg_room", {
                      msg: `"notice: server",${key},${ALL_SERVER[recentSend.DST].name} back online`,
                      date: new moment().format("DD/MM/YYYY HH:mm:ss"),
                      room: present_room_id,
                    });
                    //recalculate network hop
                    try {
                        ALL_SERVER[key].hop = helperFx.calcHop(key,TOPOLOGY);
                        ALL_NODE[key].hop = ALL_SERVER[key].hop
                        // ALL_SERVER[key].path = 
                        // ALL_NODE[key].path = 
                    } catch (err) {
                        ALL_SERVER[key].hop = "ERROR"
                        ALL_NODE[key].hop = "ERROR"
                        console.log(helperFx.time_el(T_ST),"error,",err.name, err.message,",when calculating network hop for server", key, "TOPOLOGY", TOPOLOGY);
                    }

                    //start sending message again
                    if (TS_BUFF.length > 0) {
                        setSerialRoutine();
                    }
                } else {
                    ALL_NODE[key].status = "ONLINE";
                    console.log(helperFx.time_el(T_ST),"notice: node", key, "back online");
                    io.to(present_room_id).emit("msg_room", {
                      msg: `"notice: server",${key} back online`,
                      date: new moment().format("DD/MM/YYYY HH:mm:ss"),
                      room: present_room_id,
                    });
                    //recalculate network hop
                    try {
                        ALL_NODE[key].hop = helperFx.calcHop(key,TOPOLOGY);
                        // ALL_NODE[key].path = 
                    } catch (err) {
                        console.log(helperFx.time_el(T_ST),"error,",err.name, err.message,",when calculating network hop for node", key, "TOPOLOGY", TOPOLOGY);
                        ALL_NODE[key].hop = "ERROR"
                    }

                    if (TS_BUFF.length > 0) {
                        setSerialRoutine();
                    }
                }
            }
            //remove the updated one
            NODE_LIST.splice(NODE_LIST.indexOf(key), 1);
        } else {
            if (ALL_NODE[key].status === "ONLINE") {
                if (key in ALL_SERVER) {
                    ALL_NODE[key].status = "OFFLINE"
                    ALL_SERVER[key].status = "OFFLINE"
                    
                    console.log(helperFx.time_el(T_ST),"notice: server",key,ALL_SERVER[key].name,"went offline")
                    io.to(present_room_id).emit("msg_room", {
                      msg: `"notice: server",${key},${ALL_SERVER[key].name} went offline`,
                      date: new moment().format("DD/MM/YYYY HH:mm:ss"),
                      room: present_room_id,
                    });
                    ALL_SERVER[key].hop = -1
                    ALL_NODE[key].hop = -1
                    ALL_SERVER[key].path = ""
                    ALL_NODE[key].path = ""
                } else {
                    ALL_NODE[key].status = "OFFLINE"
                    io.to(present_room_id).emit("msg_room", {
                      msg: `"notice: server",${key} went offline`,
                      date: new moment().format("DD/MM/YYYY HH:mm:ss"),
                      room: present_room_id,
                    });
                    console.log(helperFx.time_el(T_ST),"notice: node", key, "went offline")

                    ALL_NODE[key].hop = -1
                    ALL_NODE[key].path = ""
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
                hop: helperFx.calcHop(item,TOPOLOGY)
            }

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

    console.log(ALL_NODE, ALL_SERVER)
}

function ACK(f_ack) {
    let ACK_RE_TIME = Date.now();
    found = false;
    console.log("ALL SERVER:", ALL_SERVER, "ALL NODE:",ALL_NODE)
            
    for (let [i,msg] of S_BUFF.entries()) {
        //for non fragmented messages
        if (f_ack.H.ID == msg.msg.H.ID && f_ack.H.FID == -1) {
            console.log(helperFx.time_el(T_ST), "ACK", f_ack.H, "DST", msg.DST, "RTT", ACK_RE_TIME-msg.T_SEND)
            S_BUFF.splice(i,1);

            for (j in msg.id){
                updateSynced(msg.FFLAG[j], msg.id[j], msg.DST)
            }

            found = true
            break
        }

        else if (f_ack.H.ID == msg.msg.H.ID && f_ack.H.FID == msg.msg.H.FID) {
            console.log(helperFx.time_el(T_ST), "ACK", f_ack.H, "DST", msg.DST, "RTT", ACK_RE_TIME-msg.T_SEND)
            console.log("ALL SERVER:", ALL_SERVER, "ALL NODE:",ALL_NODE)
            S_BUFF[i].ACKED == true;
            found = true
            //check if all of the fragmented message was acked
            fragLen = msg.msg.H.FL;
            ackedCount = 0;
            for (let [j, m] of S_BUFF.entries()) {
                if (f_ack.H.ID == m.msg.H.ID && m.ACKED) {
                    ackedCount += 1
                    if (ackedCount == msg.msg.H.FL) {
                        break
                    }
                } else if (f_ack.H.ID == m.msg.H.ID && !m.ACKED) {
                    break
                }
            }

            if (ackedCount == msg.msg.H.FL) {
                toSplice = []
                for (let [j, m] of S_BUFF.entries()) {
                    if (f_ack.H.ID == m.msg.H.ID) {
                      toSplice.push(j)
                    }
                }

                toSplice.forEach((item, index) => {
                    S_BUFF.splice(item,1)
                })

                updateSynced(msg.FFLAG, msg.id, msg.DST)
            }
            break;
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
        ACKED: false,
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

    for (let [i, frag] of dataFrag.entries()) {
        // console.log("type of frag", typeof(frag), frag )
        msg.msg.D = frag,
        msg.msg.H.FID += 1;

        msg.PHYS_LEN = JSON.stringify(msg.msg).length
        TS_BUFF.push(JSON.parse(JSON.stringify(msg)))
        setSerialRoutine()
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
    setSerialRoutine()
}

function sendData(data, dest, _id) {
  // console.log("data:", data, "to:", dest, "id",_id)
    dataStr = JSON.stringify(data)
    // console.log(dataStr.length, config.NONFRAGMTU)
    if (dataStr.length > config.NONFRAGMTU) {
        console.log("data > FRAG")
        if (dest === "ALL") {
            for (var server in ALL_SERVER) {
                console.log("send data to ALL server:",server, ALL_SERVER)
                console.log(helperFx.time_el(T_ST),"will send to", server);
                sendFragment(dataStr, server, _id, data.FLAG);
            }
        } else {
            console.log("send data to specific server")
            sendFragment(dataStr, dest, _id, data.FLAG);
        }
    } else {
        if (dest === "ALL") {
            console.log("data < FRAG")
            console.log(ALL_SERVER)
            for (var server in ALL_SERVER) {
                console.log(helperFx.time_el(T_ST),"will send to", server, ALL_SERVER[server]);
                sendSingle(dataStr, server, _id, data.FLAG);
            }
        } else {
          sendSingle(dataStr, dest, _id, data.FLAG);
        }
    }
}

function setSerialRoutine() {
    if (sendSerialInterval == null) {
        if (BLT == 0) {
            BLT = config.BURST
            sendSerialInterval = setTimeout(sendToSerial, Math.random() * config.DELAY_MAX + config.DELAY_MIN)
        }
        else {
            sendSerialInterval = setTimeout(sendToSerial, Math.random() * config.DELAY_MIN)
            BLT -= 1
        }
    }
}

function sendToSerial() {
    let msgToSend = null;
    if (TS_BUFF.length > 0) {

        msgToSend = pickNextMSG()
        try{
          pickNextMSG()
        }
        catch(err){
          console.error(err)
        }
        if (msgToSend != null) {
            console.log(helperFx.time_el(T_ST),"sending", msgToSend.msg.F, "ID:", msgToSend.msg.H.ID)
            console.log("Physical length: ",JSON.stringify(msgToSend.msg).length)
            PORT.write(JSON.stringify(msgToSend.msg))
            msgToSend.T_SEND = Date.now();
            S_BUFF.push(msgToSend);

            if (timedoutRoutine == null) {
                timedoutRoutine = setInterval(msgTimeout, 500);
            }
            if(TS_BUFF.length == 0){
              sendSerialInterval = null;
            }
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
        let selectedMsg = TS_BUFF[0]
        console.log("selected MSG:",TS_BUFF[0], "length: ", TS_BUFF.length)
        console.log("message:",selectedMsg.DST,"status:",ALL_NODE[selectedMsg.DST].status)
        try {
            if (selectedMsg.msg.F == 3 && ALL_NODE[selectedMsg.DST].status === "ONLINE") {
                pickedMsg = selectedMsg
                console.log("from if cond:", pickedMsg)
                TS_BUFF.splice(0,1)
                return pickedMsg
            } else if (ALL_NODE[selectedMsg.DST].status === "ONLINE") {
                pickedMsg = selectedMsg
                console.log("from else if cond:", pickedMsg)
                TS_BUFF.splice(0,1);
                if (selectedMsg.msg.H.FID != -1 || selectedMsg.msg.H.AG != 1){
                    return pickedMsg
                }
                break;
            } else {
                console.log("from else cond:", pickedMsg)
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
    setSerialRoutine();
}

function handleFrontendFrame(data) {
  // console.log(data)
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
            data:{data: new Buffer.from(file_in_chat.data).toString("base64"),
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
            data:{data: new Buffer.from(file_in_chat.data).toString("base64"),
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
              if("ACK" in msg){
                if(msg.ACKED){
                  continue
                }
              }
                currentTime = Date.now()
                var timedoutMsg = msg;
                
                timedoutMsg.ER_COUNT += 1

                console.log(helperFx.time_el(T_ST), "TIMEDOUT", timedoutMsg.msg.H.ID, "at", (currentTime - msg.T_SEND) / 1000,"sec")
                toSplice.push(i)
                TS_BUFF.push(timedoutMsg)
                setSerialRoutine();
            }
        }

        toSplice.forEach((item, index) => {
            S_BUFF.splice(item,1)
          })
    }
}