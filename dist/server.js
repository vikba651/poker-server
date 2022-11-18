"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const mongoose = __importStar(require("mongoose"));
const bodyParser = __importStar(require("body-parser"));
const rounds_1 = __importDefault(require("./routes/rounds"));
const players_1 = __importDefault(require("./routes/players"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
mongoose.connect(`${process.env.DATABASE_URL}`, (error) => {
    if (error) {
        console.log('Could not connect to Mongoose');
    }
    else {
        console.log('Connected to Mongoose');
    }
});
const port = process.env.PORT ? +process.env.PORT : 8999;
server.listen(port, () => {
    console.log(`Server started on http://localhost:${port} :)`);
});
// ****** HTTP STUFF ******
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/rounds', rounds_1.default);
app.use('/players', players_1.default);
app.get('/', (req, res) => {
    res.send('Express + TypeScript server running');
});
// ******* WEB SOCKET STUFF *******
const wss = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
wss.on('connection', (ws) => {
    // console.log("addr", ws.handshake.address);
    ws.on('createSession', (data) => {
        console.log(`${data.name} wants to create a session`);
        const newSession = {
            id: sessions.length,
            code: createCode(),
            creator: data.name,
            players: [data.name],
        };
        sessions.push(newSession);
        ws.emit('sessionCreated', newSession);
    });
    ws.on('joinSession', (data) => {
        let session = sessions.find((session) => session.code === data.code);
        if (session) {
            session.players.push(data.name);
            wss.emit('sessionUpdated', session);
        }
        else {
            ws.send('Invalid session code');
        }
    });
});
let sessions = [];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function createCode() {
    let res = '';
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * ALPHABET.length);
        res = res.concat(ALPHABET[randomIndex]);
    }
    return res;
}
