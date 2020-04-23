const fs = require('fs');
const wsec = require('./index');

new wsec({port: 8080}, (socket) => {
    socket.on('connected', (connection) => {
        console.log("New Connection");
        const file = fs.readFileSync('test.txt', 'utf8');
        connection.send(file);
        // connection.send("Hello world");
    });
    socket.on('data', (connection, data) => {
        // fs.writeFile('./test.txt', data , () => {
        //     console.log("Finish");
        // });
        // connection.send(data);
    });
    socket.on('end', (connection) => {
        console.log("connection closed");
    });
});

