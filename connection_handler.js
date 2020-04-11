const headerParser = require('http-headers');
const { createHash } = require('crypto');

module.exports = class {
    connectionID;
    handShaked = false;
    headers;
    socket;

    // Storing event data
    events = {};

    constructor(socket, eventHandler) {
        this.connectionID = (+ new Date()).toString() + '-' + Math.random().toString(36).substring(7);
        this.socket = socket;
        this.socketHandler(eventHandler);
    }

    socketHandler(eventHandler) {
        this.parseEventHandler(eventHandler);
        this.setEventHandler();
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
        for(let i = 6; i < data.length; i++) {
            encoded.push(data[i]);
        }
        for (let i = 0; i < encoded.length; i++) {
            decoded.push((encoded[i] ^ mask[i % 4]));
        }
        return this.arrayToString(decoded);
    }

    setEventHandler() {
        this.socket.on('data', (data) => {
            if(!this.handShaked) {
                this.parseHeader(data);
                this.handShake();
                this.handShaked = true;
                this.events.hasOwnProperty('connected') ? this.events.connected(this.socketInstanceInfo()) : null;
                return;
            }
            this.events.hasOwnProperty('data') ? this.events.data(this.socketInstanceInfo(), this.encodeData(data)) : null;
        });

        this.socket.on('end', () => {
            this.events.hasOwnProperty('end') ? this.events.end(this.socketInstanceInfo()) : null;
        });
    }

    socketInstanceInfo() {
        return {
            write: text => {
                this.socket.write(this.constructReply(JSON.stringify(text)));
            },
            headers: this.headers,
            id: this.connectionID
        }
    }
    
    handShake() {
        let eol = "\r\n";
        let headers = "HTTP/1.1 101 Switching Protocols" + eol
        headers += "Connection: Upgrade" + eol;
        headers += "Upgrade: websocket" + eol;
        headers += `Sec-WebSocket-Accept: ${this.acceptKey()}${eol}${eol}`;
        this.socket.write(headers);
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

    constructReply (dataString) {
        const json = dataString;
        const jsonByteLength = Buffer.byteLength(json);
        // Note: we're not supporting > 65535 byte payloads at this stage 
        const lengthByteCount = jsonByteLength < 126 ? 0 : 2; 
        const payloadLength = lengthByteCount === 0 ? jsonByteLength : 126; 
        const buffer = Buffer.alloc(2 + lengthByteCount + jsonByteLength); 
        // Write out the first byte, using opcode `1` to indicate that the message 
        // payload contains text data 
        buffer.writeUInt8(0b10000001, 0); 
        buffer.writeUInt8(payloadLength, 1); 
        // Write the length of the JSON payload to the second byte 
        let payloadOffset = 2; 
        if (lengthByteCount > 0) { 
          buffer.writeUInt16BE(jsonByteLength, 2); payloadOffset += lengthByteCount; 
        } 
        // Write the JSON data to the data buffer 
        buffer.write(json, payloadOffset); 
        return buffer;
      }

    parseHeader(data) {
        this.headers = headerParser(data);
    }

    parseEventHandler(eventHandler) {
        eventHandler(this);
    }

    on(eventType, handler) {
        this.events[eventType] = handler;
    }
}