const { createHash } = require('crypto');
module.exports = class {
    connectionID;
    socket;
    headers;
    maxBufferLength = 65500;
    payloadData = '';
    bufferOffset = 2;
    sendingBuffer;

    constructor(socket, headers = null) {
        this.socket = socket;
        this.headers = headers;
        this.connectionID = (+ new Date()).toString() + '-' + Math.random().toString(36).substring(7);
    }

    uintToBase62(n) {
        if (n < 0) throw 'unsupported negative integer';
      
        if (n > 0x7FFFFFFF) {
          this.sendingBuffer.writeUInt32BE(n, 2);
        } else {
          // `~~` double bitwise operator
          // The most practical way of utilizing the power of this operator is to use it as a replacement
          // for Math.floor() function as double bitwise NOT performs the same operation a lot quicker.
          // You can use it, to convert any floating point number to a integer without performance overkill
          // that comes with Math.floor(). Additionally, when you care about minification of your code,
          // you end up using 2 characters (2 tildes) instead of 12.
          // http://rocha.la/JavaScript-bitwise-operators-in-practice
          const big = ~~(n / 0x0100000000);
          const low = (n % 0x0100000000);
          this.sendingBuffer.writeUInt32BE(big, 2);
          this.sendingBuffer.writeUInt32BE(low, 6);
        }
    }

    formatBuffer() {
        const payloadLength = Buffer.byteLength(this.payloadData);
        let bufferStatus = 0b10000001;
        let bufferLength = payloadLength;
        let payloadIndexLength =  payloadLength;

        if(payloadLength <= 125) {
            payloadIndexLength = payloadLength;
        } else if(payloadLength <= this.maxBufferLength) {
            this.bufferOffset += 2;
            payloadIndexLength = 126;
        } else if(payloadLength > this.maxBufferLength) {
            bufferLength = this.maxBufferLength;
            payloadIndexLength = 127;
            this.bufferOffset += 8;
        }
        this.sendingBuffer = Buffer.alloc(this.bufferOffset + bufferLength);
        this.sendingBuffer.writeUInt8(bufferStatus, 0); 
        this.sendingBuffer.writeUInt8(payloadIndexLength, 1);
        if(payloadIndexLength === 126) {
            this.sendingBuffer.writeUInt16BE(payloadLength, 2);
        } else if(payloadIndexLength === 127) {
            this.uintToBase62(payloadLength);
            // this.sendingBuffer.writeUInt32BE(payloadLength, 6);
        }
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

    isPayLoadEmpty() {
        return this.payloadData.length === 0 ? true : false;
    }

    writePayloadData() {
        let writedByteCount;
        if(!this.sendingBuffer) {
            let tmpBufSize;
            if(this.payloadData.length > this.maxBufferLength) {
                tmpBufSize = this.maxBufferLength;
            } else {
                tmpBufSize = this.payloadData.length;
            }
            this.sendingBuffer = Buffer.alloc(tmpBufSize);
        }
        writedByteCount = this.sendingBuffer.write(this.payloadData, this.bufferOffset);
        if(this.payloadData.length > writedByteCount) {
            this.payloadData = this.payloadData.slice(writedByteCount);
        } else {
            this.payloadData = '';
        }
        // work from here
    }

    write(msg) {
        this.payloadData = msg;
        this.formatBuffer();
        while(!this.isPayLoadEmpty()) {
            this.writePayloadData();
            this.writeOnSocket(this.sendingBuffer);
            this.sendingBuffer = null;
            this.bufferOffset = 0;
        }
        this.bufferOffset = 2;
    }

    send(msg) {
        this.write(msg);
    }

    writeOnSocket(data) {
        this.socket.write(data);
    }
}