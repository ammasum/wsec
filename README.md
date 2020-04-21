# wsec
Nodejs websocket. Easy and customize-able and fast


# install

> `npm install wsec --save`

# use

```js
const wsec = require('wsec');

const options = {
    host: 'localhost',
    port: 8080
}

const handler = (socket) => {
    // each connection params contain header information and write methods
    socket.on('connected', (connection) => {
        console.log('connected new user');
        // connection.send("congras to new user"); //to write or send text to connected user
    });
    socket.on('data', (connection, data) => {
        console.log(data);
    });
    socket.on('end', (connection) => {
        console.log("connection closed");
    });
}

new wsec(options, handler);
```

# Client Side
## This library need no client side library. You can use native methods in Client side

```JS
const socketIns = new WebSocket('ws://localhost:8080/socket');
socketIns.onmessage = function (msg) { // function will fire when data is received
    console.log(msg.data);
    socketIns.send("Hello server"); // send data to server
}
```
# Send large file
```JS
function fileUpload() {
    const img = document.createElement('INPUT');
    img.setAttribute("type", "file"); 
    img.onchange = () => {
        this.readFile(img.files[0]);
    };
    img.click();
}

function readFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
        this.sendFile(e.target.result);
    };
    reader.readAsDataURL(file);
}

function sendFile(data) {
    socketIns.send(data);
}

fileUpload();
```