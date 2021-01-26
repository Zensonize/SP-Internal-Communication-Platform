#include "painlessMesh.h"
#include <Arduino_JSON.h>

#define   MESH_PREFIX     "IPHC"
#define   MESH_PASSWORD   "ThisPasswordIsHidden"
#define   MESH_PORT       5555

Scheduler userScheduler; // to control your personal task
painlessMesh  mesh;

// User stub
// void sendMessage() ; // Prototype so PlatformIO doesn't complain
// void sendFreeMem() ; // Prototype so PlatformIO doesn't complain

// Task taskSendMessage( TASK_SECOND * 5 , TASK_FOREVER, &sendMessage );
// void sendMessage() {
//   JSONVar msg;
//   msg["FLAG"] = "DATA";
//   msg["DATA"] = "Testmessage";
//   msg["sendTime"] = String(mesh.getNodeTime());
//   mesh.sendBroadcast(JSON.stringify(msg));
// }

// Task taskSendFreeMem( TASK_SECOND * 60, TASK_FOREVER, &sendFreeMem);
// void sendFreeMem() {
//   JSONVar freeMem;
//   freeMem["FLAG"] = "MEM";
//   freeMem["MEM"] = String(ESP.getFreeHeap());
//   freeMem["BCAST"] = "TRUE";
//   Serial.println(JSON.stringify(freeMem));
// }

// Needed for painless library
void receivedCallback( uint32_t from, String &msg ) {
  JSONVar recv = JSON.parse(msg.c_str());
  recv["recvTime"] = String(mesh.getNodeTime());
  recv["FROM"] =  String(from);
  Serial.println(JSON.stringify(recv));
}

void newConnectionCallback(uint32_t nodeId) {
  // JSONVar newConn;
  // newConn["FLAG"] = "NEW_CONNECTION";
  // newConn["nodeID"] = String(nodeId);

  // Serial.println(JSON.stringify(newConn));
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
  // JSONVar changeTime;
  // changeTime["FLAG"] = "CHANGED_TIME";
  // changeTime["TIME"] = String(mesh.getNodeTime());

  // Serial.println(JSON.stringify(changeTime));
}

void handleSerialInput(String inData){
  char inDataArr[1400];
  inData.toCharArray(inDataArr,1400);
  JSONVar dataObject = JSON.parse(inDataArr);
  dataObject["sendTime"] = String(mesh.getNodeTime());

  String flag = (const char*) dataObject["FLAG"];
  if ( flag.equals("ECHO")) {
    Serial.print("broadcasting Echo");
    Serial.println(JSON.stringify(dataObject));
    mesh.sendBroadcast(JSON.stringify(dataObject));
    JSONVar sentSuccess;
    sentSuccess["FLAG"] = "READY";
    sentSuccess["SUCCESS"] = true;
    Serial.println(JSON.stringify(sentSuccess));
  }
  else {
    String to = (const char*) dataObject["TO"];
    int to_int = to.toInt();
    uint32_t to_uint = (uint32_t) to_int;
    Serial.printf("sending to int %d uint", to_int);
    Serial.println(to_uint);
    bool success = mesh.sendSingle(to_uint, JSON.stringify(dataObject));
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

  Serial.begin(115200);
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
