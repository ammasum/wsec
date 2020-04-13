# wsec
Nodejs websocket. Easy and customize-able 


# install

npm install wsec --save

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
        // connection.write("congras to new user"); //to write or send text to connected user
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