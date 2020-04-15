const receiver = require('./receiver');
const sender = require('./sender');

module.exports = class {
    receiver;
    sender;

    constructor(socket, eventHandler) {
        this.socket = socket;
        this.sender = new sender(socket);
        this.receiver = new receiver(socket, eventHandler, this.sender);
    }

}