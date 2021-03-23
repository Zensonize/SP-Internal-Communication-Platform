var config = {}

config.host = "http://0.0.0.0:3000";
config.port = 3000;
config.username_mongoDB = "admin"
config.password_mongoDB = "sunat1998"
config.db = "mongodb://127.0.0.1:27017/chat"

// From ESP32
config.SERIAL_PORT = '/dev/ttyUSB0';
config.BACKEND_LISTEN = 'http://127.0.0.1:3000';
config.ESP32_EMIT = '';
config.TIMEOUT = 5000;
config.BUADRATE = 921600;
config.MTU = 1000;

module.exports = config;
