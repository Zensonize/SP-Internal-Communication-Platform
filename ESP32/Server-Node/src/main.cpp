#include "painlessMesh.h"
#include <Arduino_JSON.h>

#define   MESH_PREFIX     "IPHC"
#define   MESH_PASSWORD   "ThisPasswordIsHidden"
#define   MESH_PORT       5555

Scheduler userScheduler; // to control your personal task
painlessMesh  mesh;

void receivedCallback( uint32_t from, String &msg ) {
  JSONVar recv = JSON.parse(msg.c_str());
  recv["recvTime"] = String(mesh.getNodeTime());
  recv["FROM"] =  String(from);

  String flag = (const char*) recv["FLAG"];
  if (flag.equals("DATA")){
    if ((bool) recv["FRAG"]) {
      sendACK(from, (int) recv["MSG_ID"], (int) recv["FRAG_ID"]);
    }
    else {
      sendACK(from, (int) recv["MSG_ID"], -1);
    }
  }
  Serial.println(JSON.stringify(recv));
}

void newConnectionCallback(uint32_t nodeId) {
  
}

void changedConnectionCallback() {
  JSONVar changeConn;
  changeConn["FLAG"] = "CHANGED_CONNECTION";

  std::list<uint32_t> nodeList = mesh.getNodeList();
  String nodeListStr = "";

  for (std::list<uint32_t>::iterator it = nodeList.begin(); it != nodeList.end(); it++){
    nodeListStr += String(*it);
    nodeListStr += ",";
  }

  changeConn["NODE_LIST"] = nodeListStr;
  changeConn["TOPOLOGY_JSON"] = mesh.subConnectionJson();
  
  Serial.println(JSON.stringify(changeConn));
}

void nodeTimeAdjustedCallback(int32_t offset) {
  
}

void sendACK(uint32_t to, int msgID, int fragID) {
  JSONVar ackMSG;
  ackMSG["FLAG"] = "ACK";
  ackMSG["ACK_MSG_ID"] = msgID;
  ackMSG["ACK_FRAG_ID"] = fragID;

  mesh.sendSingle(to, JSON.stringify(ackMSG));
}

void handleSerialInput(String inData){
  char inDataArr[1400];
  inData.toCharArray(inDataArr,1400);
  JSONVar dataObject = JSON.parse(inDataArr);
  dataObject["sendTime"] = String(mesh.getNodeTime());

  String flag = (const char*) dataObject["FLAG"];
  if ( flag.equals("ECHO")) {
    // Serial.print("broadcasting Echo");
    // Serial.println(JSON.stringify(dataObject));
    mesh.sendBroadcast(JSON.stringify(dataObject));
    JSONVar sentSuccess;
    sentSuccess["FLAG"] = "READY";
    sentSuccess["SUCCESS"] = true;
    Serial.println(JSON.stringify(sentSuccess));
  }
  else {
    // String to = (const char*) dataObject["TO"];
    // int to_int = to.toInt();
    int toA_int = (int) dataObject["TOA"];
    int toB_int = (int) dataObject["TOB"];
    uint32_t toA_uint = (uint32_t) toA_int;
    uint32_t toB_uint = (uint32_t) toB_int;
    uint32_t to = (toA_uint * 100000) + toB_uint;

    bool success = mesh.sendSingle(to, JSON.stringify(dataObject));
    JSONVar sentSuccess;
    sentSuccess["FLAG"] = "READY";
    if(success){
      sentSuccess["SUCCESS"] = true;
    }
    else {
      sentSuccess["SUCCESS"] = false;
    }
    Serial.println(JSON.stringify(sentSuccess));
  }
  
}

void setup() {

  Serial.begin(921600);
  Serial.setRxBufferSize(1400);

//mesh.setDebugMsgTypes( ERROR | MESH_STATUS | CONNECTION | SYNC | COMMUNICATION | GENERAL | MSG_TYPES | REMOTE ); // all types on
  mesh.setDebugMsgTypes( ERROR | STARTUP );  // set before init() so that you can see startup messages

  mesh.init( MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT );
  mesh.onReceive(&receivedCallback);
  mesh.onNewConnection(&newConnectionCallback);
  mesh.onChangedConnections(&changedConnectionCallback);
  mesh.onNodeTimeAdjusted(&nodeTimeAdjustedCallback);

  // userScheduler.addTask( taskSendMessage );
  // userScheduler.addTask( taskSendFreeMem );
  // taskSendFreeMem.enable();
  // taskSendMessage.enable();
}

void loop() {
  // it will run the user scheduler as well
  mesh.update();
  if (Serial.available() > 0){
    String inData = Serial.readString();
    handleSerialInput(inData);
  }
}

