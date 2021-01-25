const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");
const port = new SerialPort("/dev/cu.usbserial-0001", { baudRate: 115200 });
const parser = port.pipe(new Readline({ delimiter: "\n" })); // Read the port data

port.on("open", () => {
	console.log("serial port open");
});
parser.on("data", (data) => {
	try {
		const dataJSON = JSON.parse(data);
		console.log(dataJSON)
		if (dataJSON.FLAG === 'DATA'){
			console.log("DELAY", (Number(dataJSON.recvTime) - Number(dataJSON.sendTime))/Math.pow(10,6))
		}
	} catch (err){
		console.log('not paraseable:', data);
	}
});

function preiodicSend(){
	testObject = {
		'MSG_ID': 1,
		'FLAG': 'ECHO',
		'FRAGMENT': 'FALSE',
		'SERVER_NAME' : 'SERVER A',
		'TO': 545257057
	}
	console.log('sending message');
	port.write(JSON.stringify(testObject))
}

var repeatSend = setInterval(preiodicSend, 5000);