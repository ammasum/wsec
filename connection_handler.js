const receiver = require('./receiver');
const sender = require('./sender');

module.exports = class {
    receiver;
    sender;
    socket;
    eventHandler;

    constructor(socket, eventHandler, options) {
        if(options.socketType === 'HTTP' || options.socketType === 'HTTPS') {
            this.socket = socket.socket;
        } else {
            this.socket = socket;
        }
        this.eventHandler = eventHandler;
        this.setCommunication();
        if(options.socketType === 'HTTP' || options.socketType === 'HTTPS') {
            this.receiver.handShake(socket.headers);
        }
    }

    setCommunication() {
        this.sender = new sender(this.socket);
        this.receiver = new receiver(this.socket, this.eventHandler, this.sender);
    }

}