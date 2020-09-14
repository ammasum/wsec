# wsec
Nodejs websocket. Easy and customize-able and fast


# install

> `npm install wsec --save`

# use

## *methods 1*

will handle only ws

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

## *methods 2*

Use with your Nodejs HTTP or HTTPS server

```js
const wsec = require('wsec');

const options = {noServer: true};

const handler = (socket) => {
    // each connection params contain header information and write methods
    socket.on('connected', (connection) => {
        console.log('connected new user');
        // connection.send("congras to new user"); //to write or send text to connected user
    });
    socket.on('data', (connection, data) => {
        console.log(data);
        connection.send(JSON.stringify({status: true}));
    });
    socket.on('end', (connection) => {
        console.log("connection closed");
    });
}

const ws = new wsec(options, handler)

const server = http.createServer((req, res) => {
    if(req.url === '/socket') {
        ws.handleHttpServerConnection(req);
    } else {
        // handle others route
    }
});

server.listen(8080, () => {
    console.log("Server start at 8080");
});
```

# Client Side
## This library need no client side library. You can use native methods in Client side

```js
const socketIns = new WebSocket('ws://localhost:8080/socket');
socketIns.onmessage = function (msg) { // function will fire when data is received
    console.log(msg.data);
    socketIns.send("Hello server"); // send data to server
}
```
# Send large file

```js
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


### Utility

**Save identifier for each request**

```js
const wsec = require('wsec');

const options = {
    host: 'localhost',
    port: 8080
}

const handler = (socket) => {
    socket.on('connected', (connection) => {
        connection.setState( // set some data to per connection
            {
                id: 'xxxx',
                name: 'AM'
            }
        );
    });
    socket.on('data', (connection, data) => {
        if(connection.state.id === 'xxx') { // get this data
            // Do something
        } else {
            // Do else something
        }
    });
}

new wsec(options, handler);
```