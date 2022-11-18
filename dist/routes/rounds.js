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
// const Round = require('../models/rounds')
const rounds_1 = __importDefault(require("../models/rounds"));
const router = (0, express_1.Router)();
// Get all rounds
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rounds = yield rounds_1.default.find();
        res.json(rounds);
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
}));
// Get one round
router.get('/:id', getRound, (req, res) => {
    res.json(res.round);
});
// Create one round
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const round = new rounds_1.default(req.body);
    try {
        const newRound = yield round.save();
        res.status(200).json(newRound);
    }
    catch (e) {
        res.status(400);
    }
}));
// Update one round
router.patch('/:id', getRound, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.body.deals != null) {
        res.round.deals = req.body.deals;
    }
    try {
        const updatedRound = yield res.round.save();
        res.json(res.round);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
}));
// Delete one round
router.delete('/:id', getRound, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield res.round.remove();
        res.json({ message: 'Deleted round' });
    }
    catch (e) {
        res.status(500).json({ message: e.message });
    }
}));
function getRound(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        let round;
        try {
            round = yield rounds_1.default.findById(req.params.id);
            if (round == null) {
                return res.status(404).json({ message: 'Cannot find round' });
            }
        }
        catch (e) {
            return res.status(500).json({ message: e.message });
        }
        res.round = round;
        next();
    });
}
// router.post
exports.default = router;
