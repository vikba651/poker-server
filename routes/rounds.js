const express = require("express");
const router = express.Router();
const Round = require("../models/rounds");

// Get all
router.get("/", async (req, res) => {
  try {
    const rounds = await Round.find();
    res.json(rounds);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get one
router.get("/:id", getRound, (req, res) => {
  res.json(res.round);
});

// Create one
router.post("/", async (req, res) => {
  const round = new Round({
    name: req.body.name,
  });

  try {
    const newRound = await round.save();
    res.status(201).json(newRound);
  } catch (e) {
    res.status(400);
  }
});

// Update one
router.patch("/:id", getRound, async (req, res) => {
  if (req.body.name != null) {
    res.round.name = req.body.name;
  }

  try {
    const updatedRound = await res.round.save();
    res.json(res.round);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Delete one
router.delete("/:id", getRound, async (req, res) => {
  try {
    await res.round.remove();
    res.json({ message: "Deleted round" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

async function getRound(req, res, next) {
  let round;
  try {
    round = await Round.findById(req.params.id);
    if (round == null) {
      return res.status(404).json({ message: "Cannot find round" });
    }
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }

  res.round = round;
  next();
}
module.exports = router;
