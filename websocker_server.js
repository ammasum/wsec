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

    // params option is for server option. Like port and host
    // params handler is for handler event and function. Like on data, on end
    constructor(options, handler) {
        if(typeof options !== 'object') {
            handler = options;
            options = {};
        }
        this.parseOptions(options);
        this.parseHandler(handler)
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
        this.server = net.createServer();
        this.server.on('connection', (socket) => {
            new connectionHandler(socket, this.eventHandler);
        })
        this.server.listen(this.port, this.host, () => {
            console.log(`Server started at http://${this.host}:${this.port}`);
        });

        Object.keys(ifaces).forEach((ifname) => {
            var alias = 0;

            ifaces[ifname].forEach((iface) => {
                if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
                }

                if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                console.log(ifname + ':' + alias, iface.address);
                } else {
                // this interface has only one ipv4 adress
                    this.server.listen(this.port, iface.address, () => {
                        console.log(`Server started at http://${iface.address}:${this.port}`);
                    });
                }
                ++alias;
            });
        });
    }
    

    parseOptions(options) {
        this.host = options.hasOwnProperty('host') ? options.host : this.host;
        this.port = options.hasOwnProperty('port') ? options.port : this.port;
    }
}
