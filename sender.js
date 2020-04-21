const { createHash } = require('crypto');
module.exports = class {
    connectionID;
    socket;
    headers;

    constructor(socket, headers = null) {
        this.socket = socket;
        this.headers = headers;
        this.connectionID = (+ new Date()).toString() + '-' + Math.random().toString(36).substring(7);
    }

    formatMessage(payloadData) {
        const payloadLength = Buffer.byteLength(payloadData);
        let payloadIndexLength =  payloadLength
        let buffer;
        let offset = 2;

        if(payloadLength > 125) {
            payloadIndexLength = 126;
            offset += 2;
        }
        buffer = Buffer.alloc(offset + payloadLength);
        buffer.writeUInt8(0b10000001, 0); 
        buffer.writeUInt8(payloadIndexLength, 1);
        if(payloadLength > 125) {
            buffer.writeUInt16BE(payloadLength, 2);
        }
        buffer.write(payloadData, offset);
        return buffer;
    }

    setHeader(headers) {
        this.headers = headers;
    }

    socketKey() {
        return this.headers.headers['sec-websocket-key'];
    }

    acceptKey() {
        let magicStr = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
        let secWSA = this.socketKey() + magicStr;
        var shasum = createHash('sha1')
        shasum.update(secWSA);
        return shasum.digest('base64');
    }

    handShakeHeader() {
        let eol = "\r\n";
        let headers = "HTTP/1.1 101 Switching Protocols" + eol
        headers += "Connection: Upgrade" + eol;
        headers += "Upgrade: websocket" + eol;
        headers += `Sec-WebSocket-Accept: ${this.acceptKey()}${eol}${eol}`;
        return headers;
    }

    handShake() {
        this.writeOnSocket(this.handShakeHeader());
    }

    write(msg) {
        this.writeOnSocket(this.formatMessage(msg));
    }

    send(msg) {
        this.writeOnSocket(this.formatMessage(msg));
    }

    writeOnSocket(data) {
        this.socket.write(data);
    }
}