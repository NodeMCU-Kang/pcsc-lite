var express = require('express');
var router = express.Router();

var pcsc = require('pcsclite');
var iconv = require('iconv-lite');

const { SerialPort, ReadlineParser } = require('serialport')
const port = new SerialPort({ path: '/dev/tty.usbserial-8152B59600', baudRate: 115200 })
const parser = new ReadlineParser()
port.pipe(parser)

//port.write("serial port test\r");

//
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


/* GET users listing. */
router.get('/', function (req, res, next) {
  read_pcsc(res);

  //res.send("aaa");
});

module.exports = router;


