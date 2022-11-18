"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const nests = [];
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const nest = nests.find((nest) => nest.id == id);
    console.log(id);
    if (nest) {
        res.json(nest);
    }
    else {
        res.status(404).send('nest not found');
    }
});
router.post('/:id', (req, res) => {
    let nest = req.body;
    nest.id = nests.length;
    try {
        nests.push(nest);
        res.send('Success');
    }
    catch (error) {
        res.status(400).send('Bad');
    }
});
router.put('/:id', (req, res) => {
    res.send('Got a PUT request at /user');
});
router.delete('/:id', (req, res) => {
    res.send('Got a DELETE request at /user');
});
router.get('/:id', (req, res) => {
    res.json(nests);
});
module.exports = router;
