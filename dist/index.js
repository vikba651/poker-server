"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
// import cors from 'cors';
const body_parser_1 = __importDefault(require("body-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
// app.use(cors)
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
app.get('/', (req, res) => {
    res.send('Express + TypeScript Server bababasd');
});
app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
let sessions = [];
app.get('/sessions', (req, res) => {
    res.json({ sessions });
});
app.post('/session/create', (req, res) => {
    const creator = req.body.creator;
    const code = createCode();
    sessions.push({
        id: sessions.length,
        code: code,
        creator: creator,
        players: []
    });
    res.json({ code });
});
app.post('/session/join', (req, res) => {
    const code = req.body.code;
    let session = sessions.find((session) => session.code === code);
    if (session) {
        session.players.push(req.body.name);
        res.json(session);
    }
    else {
        res.status(404).send("Session not found");
    }
});
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function createCode() {
    let res = "";
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * ALPHABET.length);
        res = res.concat(ALPHABET[randomIndex]);
    }
    return res;
}
