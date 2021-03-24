var config = {}

config.host = "http://127.0.0.1:3001";
config.port = 3001;

// From ESP32 
config.SERIAL_PORT = '/COM23';
config.BACKEND_LISTEN = 'http://10.58.39.164:3000';
config.ESP32_EMIT = '';
config.TIMEOUT = 5000;
config.BUADRATE = 921600;
config.MTU = 1000;

module.exports = config;