const headerParser = require('http-headers');
module.exports = class {
    socket;
    handler;
    sender;
    frame = [];
    endConnection = false;
    enabledContinueFrame = false;
    enabledContinueStream = false;
    decodedStreamData = [];
    encodedStreamData = [];
    streamPayloadLength = 0;
    mask = [];

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
        this.setDecodeData(data);
        const decodedData = this.decodeData();
        if(typeof decodedData === 'string' && decodedData === 'CONNECTION_CLOSE') {
            return;
        }

        if(typeof decodedData === 'string' && decodedData === 'BUFFER_CONTINUE') {
            return;
        }

        if(typeof decodedData === 'string' && decodedData === 'FRAME_CONTINUE') {
            return;
        }
        data = this.arrayToString(this.frame);
        // checking data event handler pass throw constructor
        this.handler.emit('data', this.sender, data);
    }

    arrayToString(data) {
        let str = '';
        for(let i = 0; i < data.length; i++) {
            str += String.fromCharCode(data[i]);
        }
        return str;
    }

    resetDecodeData() {
        this.enabledContinueStream = false;
        this.streamPayloadLength = 0;
        this.decodedStreamData = [];
        this.encodedStreamData = [];
    }

    setDecodeData(data) {
        if(this.enabledContinueStream) {
            this.encodedStreamData = Buffer.concat([this.encodedStreamData, data], this.encodedStreamData.length + data.length);
            this.enabledContinueStream = false;
            return;
        } 
        if(data[0] === 136) {
            this.endConnection = true;
            return;
        }
        
        let offset = 2;
        if(data[0] === 0) {
            console.log("Condition");
            this.enabledContinueFrame = false;
        }
        if(data[0] < 129) {
            this.enabledContinueFrame = true;
        }
        if(data[1] <= 253) {
            this.streamPayloadLength = data[1] - 128;
        } else if(data[1] === 254) {
            this.streamPayloadLength = (data[offset++] << 8) | (data[offset++]);
        } else {
            let payloadLength = (data[offset++] << 8) | (data[offset++]);
            payloadLength = (payloadLength << 8) | (data[offset++]);
            payloadLength = (payloadLength << 8) | (data[offset++]);
            payloadLength = (payloadLength << 8) | (data[offset++]);
            payloadLength = (payloadLength << 8) | (data[offset++]);
            payloadLength = (payloadLength << 8) | (data[offset++]);
            payloadLength = (payloadLength << 8) | (data[offset++]);
            this.streamPayloadLength = payloadLength;
        }
        this.mask = [data[offset++], data[offset++], data[offset++], data[offset++]];
        this.encodedStreamData = data.slice(offset);
    }

    decodeData() {
        if(this.endConnection) {
            return "CONNECTION_CLOSE";
        }
        if(this.encodedStreamData.length !== this.streamPayloadLength) {
            this.enabledContinueStream = true;
            return 'BUFFER_CONTINUE';
        }
        for (let i = 0; i < this.encodedStreamData.length; i++) {
            this.decodedStreamData.push((this.encodedStreamData[i] ^ this.mask[i % 4]));
        }
        this.frame = this.frame.concat(this.decodedStreamData);
        this.resetDecodeData();
        if(this.enabledContinueFrame) {
            return 'FRAME_CONTINUE';
        }
        return 'FRAME_COMPLATED';
    }


    handShake(data) {
        this.sender.setHeader(headerParser(data));
        this.sender.handShake();
        this.handShaked = true; // enable hand shake to prevent hand shake again
    }
}