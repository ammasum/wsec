
const headerParser = require('http-headers');
module.exports = class {
    socket;
    handler;
    sender;
    handShaked = false;
    frame = [];
    endConnection = false;
    enabledContinueFrame = false;
    enabledContinueStream = false;
    decodedStreamData = [];
    encodedStreamData = [];
    streamPayloadLength = 0;
    mask = [];
    currentData;
    currentOffset = 2;

    constructor(socket, handler, sender) {
        this.socket = socket;
        this.handler = handler;
        this.sender = sender;
        this.setHandler();
    }

    setHandler() {
        this.socket.on('data', (data) => {
            this.currentData = data;
            this.onData();
        });
        this.socket.on('end', () => {
            this.handler.emit('end', this.sender);
        });
    }

    onData() {
        // if not hand shake then first data will be hand shake
        if(!this.handShaked) {
            this.handShake(this.currentData);
            return;
        }
        if(!this.complateData()) {
            return;
        }
        const data = this.arrayToString(this.frame);
        this.frame = [];
        // checking data event handler pass throw constructor
        this.handler.emit('data', this.sender, data);
    }

    decodeStatus(status) {
        if(typeof status === 'string' && status === 'CONNECTION_CLOSE') {
            return false;
        }

        if(typeof status === 'string' && status === 'BUFFER_CONTINUE') {
            return false;
        }

        if(typeof status === 'string' && status === 'FRAME_CONTINUE') {
            return false;
        }
        return true;
    }

    complateData() {
        let decodedData;
        this.filterEndingStream()
        decodedData = this.decodeData();
        if(this.decodeStatus(decodedData) && this.currentData === null) {
            return true;
        }
        this.setDecodeData();
        decodedData = this.decodeData();
        if(this.decodeStatus(decodedData)) {
            return true;
        }
        return false;
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

    filterEndingStream() {
        if(this.enabledContinueStream) {
            for(let i = 0; i < this.currentData.length; i++) {
                if(this.encodedStreamData.length === this.streamPayloadLength) {
                    this.currentData = this.currentData.slice(i);
                    return;
                }
                this.encodedStreamData.push(this.currentData[i]);
            }
            this.currentData = null;
        }
    }

    setDecodeData() {
        if(this.currentData === null) {
            return;
        }
        if(this.currentData[0] === 136) {
            this.endConnection = true;
            return;
        }
        
        if(this.currentData[0] === 128 || this.currentData[0] === 129) {
            this.enabledContinueFrame = false;
        }
        if(this.currentData[0] < 128) {
            this.enabledContinueFrame = true;
        }
        this.parsePayloadLength();
        this.mask = [
            this.currentData[this.currentOffset++],
            this.currentData[this.currentOffset++],
            this.currentData[this.currentOffset++],
            this.currentData[this.currentOffset++]
        ];
        this.encodedStreamData = [];
        for(let i = this.currentOffset; i < this.currentData.length; i++) {
            this.encodedStreamData.push(this.currentData[i]);
        }

        this.currentOffset = 2;
    }

    parsePayloadLength() {
        if(this.currentData[1] <= 253) {
            this.streamPayloadLength = this.currentData[1] - 128;
        } else if(this.currentData[1] === 254) {
            this.streamPayloadLength = (this.currentData[this.currentOffset++] << 8) | (this.currentData[this.currentOffset++]);
        } else {
            let payloadLength = (this.currentData[this.currentOffset++] << 8) | (this.currentData[this.currentOffset++]);
            payloadLength = (payloadLength << 8) | (this.currentData[this.currentOffset++]);
            payloadLength = (payloadLength << 8) | (this.currentData[this.currentOffset++]);
            payloadLength = (payloadLength << 8) | (this.currentData[this.currentOffset++]);
            payloadLength = (payloadLength << 8) | (this.currentData[this.currentOffset++]);
            payloadLength = (payloadLength << 8) | (this.currentData[this.currentOffset++]);
            payloadLength = (payloadLength << 8) | (this.currentData[this.currentOffset++]);
            this.streamPayloadLength = payloadLength;
        }
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
        return 'DATA_COMPLATED';
    }


    handShake(data) {
        if(Buffer.isBuffer(data)) {
            data = data.toString();
        }
        if(typeof data === 'string') {
            data = headerParser(data).headers;
        } 
        this.sender.setHeader(data);
        this.sender.handShake();
        this.handler.emit('connected', this.sender);
        this.handShaked = true; // enable hand shake to prevent hand shake again
    }
}