const net = require('net');
const connectionHandler = require('./connection_handler');
module.exports = class {
    server;
    host = 'localhost';
    port = '8080';

    // params option is for server option. Like port and host
    // params handler is for handler event and function. Like on data, on end
    constructor(options, handler) {
        if(typeof options !== 'object') {
            handler = options;
            options = {};
        }
        this.parseOptions(options);
        this.createServer(handler);
    }

    createServer(handler) {
        this.server = net.createServer();
        this.server.on('connection', (socket) => {
            new connectionHandler(socket, handler);
        })
        this.server.listen(this.port, this.host, () => {
            console.log(`Server started at http://${this.host}:${this.port}`);
        });
    }
    

    parseOptions(options) {
        this.host = options.hasOwnProperty('host') ? options.host : this.host;
        this.port = options.hasOwnProperty('port') ? options.port : this.port;
    }
}