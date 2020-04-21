const fs = require('fs');
const wsec = require('./index');

new wsec({port: 8080}, (socket) => {
    socket.on('connected', (connection) => {
        const file = fs.readFileSync('test.txt', 'utf8');
        connection.send(file);
    });
    socket.on('data', (connection, data) => {
        fs.writeFile('./test.txt', data , () => {
            console.log("Finish");
        });
        // connection.send(data);
    });
    socket.on('end', (connection) => {
        console.log("connection closed");
    });
});

