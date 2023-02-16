var fs = require("fs");

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

var args = process.argv.slice(2);
console.log(args);

var settings = {};

try {
  var data = fs.readFileSync("settings.json", "utf-8")
  console.log(data);
  settings = JSON.parse(data);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('File not found!');
    settings.COM = "";
    settings.receiver = "";
  } else {
    throw err;
  }
}

console.log(settings);

console.log("******************************************************");
console.log("*");
console.log("*   身分證號傳送設定");
console.log("*");
console.log("*     -連接埠目前設定:" + settings.COM);
console.log("*     -接收器目前設定:" + settings.receiver);
console.log("*");
console.log("******************************************************");
readline.question('連接埠:請查詢裝置管理員輸入，輸入空白將沿用目前的 ' + settings.COM + ": ", COM_port => {
  COM_port = (COM_port.length == 0) ? settings.COM : COM_port;

  readline.question('接收器:請查詢接收器上的4位數編號，輸入空白將沿用目前的 ' + settings.receiver + ": ", receiver_no => {
    receiver_no = (receiver_no.length == 0) ? settings.receiver : receiver_no;
    readline.close();

    console.log(COM_port, receiver_no);
    settings.COM = COM_port;
    settings.receiver = receiver_no;
    fs.writeFile("settings.json", JSON.stringify(settings), (err) => {
      if (err) console.log(err.Error);
      console.log("Successfully Written to File.");
    });
  });

});

