// const fs = require('fs');
// const wsec = require('./index');

// new wsec({port: 8080}, (socket) => {
//     socket.on('connected', (connection) => {
//         console.log("New Connection");
//         // connection.send("Hello world");
//     });
//     socket.on('data', (connection, data) => {
//         fs.writeFile('./test.txt', data , () => {
//             console.log("Finish");
//         });
//         connection.send(data);
//     });
//     socket.on('end', (connection) => {
//         console.log("connection closed");
//     });
// });




const http = require('http');
const wsec = require('./index');
const ws = new wsec({noServer: true}, (socket) => {
 socket.on('connected', (connection) => {
    console.log("New connectio");
 });
});

const server = http.createServer((req, res) => {
    ws.handleHttpServerConnection(req);
});

server.listen(8080, () => {
    console.log("Server start at 8080");
});