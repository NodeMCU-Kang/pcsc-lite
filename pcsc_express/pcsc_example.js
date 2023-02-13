var pcsc = require('pcsclite');
var iconv = require('iconv-lite');

// var pcsc = pcsc();

function read_pcsc() {
    var pcsc1 = pcsc(); // using - var pcsc = pcsc(); - would get a wield error
    console.log("XXX");

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
                console.log(err);
                return exit();
            }
            reader.transmit(cmd_select, 255, protocol, function (err, data) {
                if (err) {
                    console.log(err);
                    return exit();
                }
                console.log('Data received', data);
                reader.transmit(cmd_command, 255, protocol, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Data received', data);
                        console.log('Data received', data.toString());
                        console.log(iconv.decode(data, "big5"))
                    }
                    return exit();
                });
            });
        });
    });




}

setInterval(read_pcsc, 3000);
