const net = require('net');
const Events = require('events');
const os = require('os');
const ifaces = os.networkInterfaces();
const connectionHandler = require('./connection_handler');
module.exports = class {
    server;
    host = 'localhost';
    port = '8080';
    eventHandler;
    noServer = false;

    // params option is for server option. Like port and host
    // params handler is for handler event and function. Like on data, on end
    constructor(options, handler) {
        if(typeof options !== 'object') {
            handler = options;
            options = {};
        } else if(options.hasOwnProperty('noServer') && options.noServer) {
            this.noServer = true;
        }
        this.parseOptions(options);
        this.parseHandler(handler);
        this.createServer();
    }

    parseHandler(handler) {
        this.eventHandler = new Events();
        const socket = {
            on: (event, handler) => {
                this.eventHandler.on(event, handler)
            }
        }
        handler(socket);
    }

    createServer() {
        if(this.noServer) {
            return;
        }
        this.server = net.createServer();
        this.server.on('connection', (socket) => {
            new connectionHandler(socket, this.eventHandler, {socketType: 'NET'});
        })
        this.server.listen(this.port, this.host, () => {
            console.log(`Server started at ws://${this.host}:${this.port}`);
        });
    }

    handleHttpServerConnection(request) {
        new connectionHandler(request, this.eventHandler, {socketType: 'HTTP'});
    }
    

    parseOptions(options) {
        this.host = options.hasOwnProperty('host') ? options.host : this.host;
        this.port = options.hasOwnProperty('port') ? options.port : this.port;
    }
}
