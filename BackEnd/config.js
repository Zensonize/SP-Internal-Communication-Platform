var config = {}

config.host = "http://10.5.50.206:3000";
config.port = 3000;
config.db = "mongodb://10.5.50.206:27017/chat"

// From ESP32 
config.SERIAL_PORT = '/dev/ttyUSB0';
config.BACKEND_LISTEN = 'http://10.5.50.232:3000';
config.ESP32_EMIT = '';
config.TIMEOUT = 10000;
config.BUADRATE = 921600;
config.MTU = 1000;

module.exports = config;