var express = require('express');
var router = express.Router();
var app = express()

var pcsc = require('pcsclite');
var iconv = require('iconv-lite');

var path = require('path');

const { SerialPort, ReadlineParser } = require('serialport');
const parser = new ReadlineParser();
var port;           // Serial ports
var usb_ports = []; // Serial-on-USB

var server;

// = new SerialPort({ path: '/dev/tty.usbserial-71569FED00', baudRate: 115200 });
// port.pipe(parser);

app.use(express.static(__dirname));

app.get('/', function (req, res) {
  //res.send('Hello World')

  var options = {
    root: path.join(__dirname)
  };

  var fileName = 'main.html';
  res.sendFile(fileName, options, function (err) {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
})

app.get("/get_id", function (req, res, next) {
  console.log("GetID");
  read_pcsc(res);
});

app.get("/get_ports", async function (req, res, next) {
  console.log("GetPorts");
  res.send(usb_ports.length.toString());
});

app.get("/quit", async function (req, res, next) {
  console.log("Quit");
  res.send("請重新執行 run.bat");
  app.close();
});

function read_pcsc(res) {
  console.log("讀取健保卡");
  var pcsc1 = pcsc(); // using - var pcsc = pcsc(); - would get a wield error

  pcsc1.on('reader', function (reader) {
    console.log(reader);
    function exit() {
      reader.disconnect(() => console.log("disconnect")); // fix [Error: SCardConnect error: Sharing violation.(0x8010000b)]
      reader.close();
      pcsc1.close();
    }

    //cmd_select = new Buffer([0x00, 0xA4, 0x04, 0x00, 0x0A, 0xA0, 0x00, 0x00, 0x00, 0x62, 0x03, 0x01, 0x0C, 0x06, 0x01]);
    cmd_select = Buffer.from([0x00, 0xA4, 0x04, 0x00, 0x10, 0xD1, 0x58, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x11, 0x00]);
    //cmd_command = new Buffer([0x00, 0x00, 0x00, 0x00]);
    cmd_command = Buffer.from([0x00, 0xca, 0x11, 0x00, 0x02, 0x00, 0x00]);

    console.log('Using:', reader.name);

    reader.connect(function (err, protocol) {
      if (err) {
        console.log("1:", err.message);
        if (err.message.includes("No smart card inserted")) {
          console.log("請插入健保卡");
          res.send("請插入健保卡");
        } else {
          res.send(err.message);
        }
        return exit();
      }
      reader.transmit(cmd_select, 255, protocol, function (err, data) {
        if (err) {
          console.log("2:", err.message);
          res.send(err.message);
          return exit();
        }
        reader.transmit(cmd_command, 255, protocol, function (err, data) {
          if (err) {
            console.log("3:", err.message);
            res.send(err.message);
          } else {
            console.log('Data received', data);
            console.log('Data received', data.toString());
            var big5Data = iconv.decode(data, "big5");

            port.write(big5Data.substr(29, 10));
            port.write("\r");
            res.send(big5Data.substr(12, 15) + "女士/先生，您好！ 您的身分證字號是：" + big5Data.substr(29, 10));
          }
          return exit();
        });
      });
    });
  });

  pcsc1.on('error', function (err) {
    console.log('PCSC error', err.message);
  });
}

SerialPort.list().then(portlist => {
  for (var i = 0; i < portlist.length; i++) {
    if (portlist[i].path.includes("usb")) {
      console.log(portlist[i].path);
      usb_ports.push(portlist[i].path);
    }
  }

  if (usb_ports.length == 1) {
    console.log("Open port:", usb_ports[0]);
    port = new SerialPort({ path: usb_ports[0], baudRate: 115200 });
    port.pipe(parser);
  }


});


console.log("Listen to port:3000");

server = app.listen(3000)
