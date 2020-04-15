const headerParser = require('http-headers');
module.exports = class {
    socket;
    handler;
    sender;

    constructor(socket, handler, sender) {
        this.socket = socket;
        this.handler = handler;
        this.sender = sender;
        this.setHandler();
    }

    setHandler() {
        this.socket.on('data', (data) => {
            this.onData(data);
        });
        this.socket.on('end', () => {
            this.handler.emit('end', this.sender);
        });
    }

    onData(data) {
        // if not hand shake then first data will be hand shake
        if(!this.handShaked) {
            this.handShake(data);
            this.handler.emit('connected', this.sender);
            return;
        }
        const encodedData = this.encodeData(data);
        if(typeof encodedData === 'string' && encodedData === 'CONNECTION_CLOSE') {
            return;
        }

        // checking data event handler pass throw constructor
        this.handler.emit('data', this.sender, encodedData);
    }

    arrayToString(data) {
        let str = '';
        for(let i = 0; i < data.length; i++) {
            str += String.fromCharCode(data[i]);
        }
        return str;
    }

    encodeData(data) {
        const decoded = [];
        const encoded = [];
        const mask = [data[2], data[3], data[4], data[5]];
        if(data[0] === 136) {
            return "CONNECTION_CLOSE";
        }
        for(let i = 6; i < data.length; i++) {
            encoded.push(data[i]);
        }
        for (let i = 0; i < encoded.length; i++) {
            decoded.push((encoded[i] ^ mask[i % 4]));
        }
        return this.arrayToString(decoded);
    }


    handShake(data) {
        this.sender.setHeader(headerParser(data));
        this.sender.handShake();
        this.handShaked = true; // enable hand shake to prevent hand shake again
    }
}