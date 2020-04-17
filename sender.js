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

    formatMessage(dataString) {
        const jsonByteLength = Buffer.byteLength(dataString);
        // Note: we're not supporting > 65535 byte payloads at this stage 
        const lengthByteCount = jsonByteLength < 126 ? 0 : 2; 
        const payloadLength = lengthByteCount === 0 ? jsonByteLength : 126; 
        const buffer = Buffer.alloc(2 + lengthByteCount + jsonByteLength); 
        // Write out the first byte, using opcode `1` to indicate that the message 
        // payload contains text data 
        buffer.writeUInt8(0b10000001, 0); 
        buffer.writeUInt8(payloadLength, 1); 
        // Write the length of the STRING payload to the second byte 
        let payloadOffset = 2; 
        if (lengthByteCount > 0) { 
          buffer.writeUInt16BE(jsonByteLength, 2); payloadOffset += lengthByteCount; 
        } 
        // Write the STRING data to the data buffer 
        buffer.write(dataString, payloadOffset); 
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