#include "painlessMesh.h"
#include <Arduino_JSON.h>

#define   MESH_PREFIX     "IPHC"
#define   MESH_PASSWORD   "ThisPasswordIsHidden"
#define   MESH_PORT       5555

Scheduler userScheduler; // to control your personal task
painlessMesh  mesh;

// User stub
void sendMessage() ; // Prototype so PlatformIO doesn't complain
void sendFreeMem() ; // Prototype so PlatformIO doesn't complain

Task taskSendMessage( TASK_SECOND * 5 , TASK_FOREVER, &sendMessage );
void sendMessage() {
  JSONVar msg;
  msg["FLAG"] = "DATA";
  msg["DATA"] = "Testmessage";
  msg["sendTime"] = String(mesh.getNodeTime());
  mesh.sendBroadcast(JSON.stringify(msg));
}

Task taskSendFreeMem( TASK_SECOND * 10, TASK_FOREVER, &sendFreeMem);
void sendFreeMem() {
  JSONVar freeMem;
  freeMem["FLAG"] = "MEM";
  freeMem["MEM"] = String(ESP.getFreeHeap());
  Serial.println(JSON.stringify(freeMem));
}

// Needed for painless library
void receivedCallback( uint32_t from, String &msg ) {
  JSONVar recv = JSON.parse(msg.c_str());
  recv["recvTime"] = String(mesh.getNodeTime());
  recv["FROM"] = String(from);
  Serial.println(JSON.stringify(recv));
}

void newConnectionCallback(uint32_t nodeId) {
  JSONVar newConn;
  newConn["FLAG"] = "NEW_CONNECTION";
  newConn["nodeID"] = String(nodeId);

  Serial.println(JSON.stringify(newConn));
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
  JSONVar changeTime;
  changeTime["FLAG"] = "CHANGED_TIME";
  changeTime["TIME"] = String(mesh.getNodeTime());

  Serial.println(JSON.stringify(changeTime));
}

void setup() {

  Serial.begin(115200);

//mesh.setDebugMsgTypes( ERROR | MESH_STATUS | CONNECTION | SYNC | COMMUNICATION | GENERAL | MSG_TYPES | REMOTE ); // all types on
  mesh.setDebugMsgTypes( ERROR | STARTUP );  // set before init() so that you can see startup messages

  mesh.init( MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT );
  mesh.onReceive(&receivedCallback);
  mesh.onNewConnection(&newConnectionCallback);
  mesh.onChangedConnections(&changedConnectionCallback);
  mesh.onNodeTimeAdjusted(&nodeTimeAdjustedCallback);

  userScheduler.addTask( taskSendMessage );
  userScheduler.addTask( taskSendFreeMem );
  taskSendFreeMem.enable();
  taskSendMessage.enable();
}

void loop() {
  // it will run the user scheduler as well
  mesh.update();
}