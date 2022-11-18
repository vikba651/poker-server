"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const players_1 = __importDefault(require("../models/players"));
const router = (0, express_1.Router)();
// Get all players
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const players = yield players_1.default.find();
        res.json(players);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
}));
// Get one player
router.get('/:id', getPlayer, (req, res) => {
    res.json(res.player);
});
// Create one player
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const player = new players_1.default(req.body);
    console.log(req.body);
    try {
        const newPlayer = yield player.save();
        res.status(200).json(newPlayer);
    }
    catch (e) {
        res.status(400);
    }
}));
// Update one player
router.patch('/:id', getPlayer, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.body.name != null) {
        res.player.name = req.body.name;
    }
    try {
        const updatedPlayer = yield res.player.save();
        res.json(res.player);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
}));
// Delete one player
router.delete('/:id', getPlayer, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield res.player.remove();
        res.json({ message: 'Deleted player' });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
}));
function getPlayer(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        let player;
        try {
            player = yield players_1.default.findById(req.params.id);
            if (player == null) {
                return res.status(404).json({ message: 'Cannot find player' });
            }
        }
        catch (e) {
            return res.status(500).json({ message: e.message });
        }
        res.player = player;
        next();
    });
}
// router.post;
exports.default = router;
