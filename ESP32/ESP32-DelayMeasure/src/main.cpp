#include "painlessMesh.h"
#include <Arduino_JSON.h>

#define   MESH_PREFIX     "IPHC-DEV"
#define   MESH_PASSWORD   "123456789"
#define   MESH_PORT       5555
#define   ONBOARD_LED     2

#define INIT 0
#define READY 1
#define CHANGE 2
#define ECHO 3
#define DATA 4
#define ACK 5

Scheduler userScheduler; // to control your personal task
painlessMesh  mesh;

void returnACK(uint32_t to, int ID, int FID) {
  JSONVar ack;
  JSONVar ackHeader;
  ackHeader["ID"] = ID;
  ackHeader["FID"] = FID;
  ack["F"] = ACK;
  ack["H"] = ackHeader;

  mesh.sendSingle(to, JSON.stringify(ack));
}

void receivedCallback( uint32_t from, String &msg ) {
  digitalWrite(ONBOARD_LED,HIGH);
  JSONVar recv = JSON.parse(msg.c_str());
  recv["H"]["FR"] =  String(from);

  if ((int) recv["F"] == DATA){
    returnACK(from, (int) recv["H"]["ID"], (int) recv["H"]["FID"]);
  }

  Serial.println(JSON.stringify(recv));
  digitalWrite(ONBOARD_LED,LOW);
}

void changedConnectionCallback() {
  JSONVar change;
  JSONVar changeData;

  change["F"] = CHANGE;

  std::list<uint32_t> nodeList = mesh.getNodeList();
  String nodeListStr = "";

  for (std::list<uint32_t>::iterator it = nodeList.begin(); it != nodeList.end(); it++){
    nodeListStr += String(*it);
    nodeListStr += ",";
  }
  changeData["NL"] = nodeListStr;
  changeData["TP"] = mesh.subConnectionJson();
  
  change["D"] = changeData;

  Serial.println(JSON.stringify(change));
}

void returnSuccess(bool status){
  JSONVar ready;

  ready["F"] = READY;
  if(status){
    ready["D"] = 1;
  }
  else {
    ready["D"] = 0;
  }
  Serial.println(JSON.stringify(ready));
}

void handleSerialInput(String inData){
  digitalWrite(ONBOARD_LED,HIGH);
  char inDataArr[1500];
  inData.toCharArray(inDataArr,1500);
  JSONVar dataObject = JSON.parse(inDataArr);

  int toA_int = (int) dataObject["H"]["DA"];
  int toB_int = (int) dataObject["H"]["DB"];
  uint32_t toA_uint = (uint32_t) toA_int;
  uint32_t toB_uint = (uint32_t) toB_int;
  uint32_t to = (toA_uint * 100000) + toB_uint;
  bool success = mesh.sendSingle(to, JSON.stringify(dataObject));
  returnSuccess(success);
  digitalWrite(ONBOARD_LED,LOW);
}

void backendInit(){
  JSONVar sysinit;
  sysinit["F"] = INIT;
  sysinit["D"] = String(mesh.getNodeId());

  Serial.println(JSON.stringify(sysinit));

  // JSONVar obj1;
  // JSONVar obj2;

  // obj1["A"] = 1234;
  // obj1["B"] = 5678;
  // obj2["TX"] = "DATA";
  // obj2["RX"] = "TEST";
  // obj1["DATA"] = obj2;

  // Serial.println(JSON.stringify(obj1));
}

void setup() {
  pinMode(ONBOARD_LED,OUTPUT);
  Serial.begin(921600);
  Serial.setRxBufferSize(1500);

  mesh.setDebugMsgTypes( ERROR | STARTUP | CONNECTION); 
  mesh.init( MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT );
  mesh.onReceive(&receivedCallback);
  mesh.onChangedConnections(&changedConnectionCallback);

  backendInit();
}

void loop() {
  // it will run the user scheduler as well
  mesh.update();
  if (Serial.available() > 0){
    String inData = Serial.readString();
    handleSerialInput(inData);
  }
}

