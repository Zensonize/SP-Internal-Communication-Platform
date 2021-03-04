const schema = {}
var mongoose = require("mongoose");

// User register schema
schema.user_register = mongoose.Schema({
    registername: String,
    password: String,
    synced: [{type: String}],
    owner: String
  });

// Chat schema
schema.chat_schema = mongoose.Schema({
    username: String,
    msg: String,
    date: String,
    room: String,
    synced: [{type: String}],
    FLAG: String,
    owner: String
  });

// Room name Schema
schema.Room_schema = mongoose.Schema({
    RoomID: String,
    synced: [{type: String}],
    owner: String
  });
  
// ESP32 Node Schema
schema.Node_schema = mongoose.Schema({
    nodeID: String,
    isServer: Boolean,
    nodeName: String,
    synced: [{type: String}],
    owner: String
  })

module.exports = schema;