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

config.TIMEOUT = [0,5000,10000,10000,10000,10000,10000,10000];
config.BUADRATE = 921600;

config.MTU = 1400;
config.FRAGMTU = 1320;
config.NONFRAGMTU = 1319;
config.BURST = 2;
config.DELAY_MIN = 50;
config.DELAY_MAX = 500;

config.SELF_ID = "3047322725";
config.SERVER_NAME = "SERVER B";
module.exports = config;
