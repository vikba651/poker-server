const express = require("express");
const router = express.Router();
const Round = require("../models/rounds");

// Get all rounds
router.get("/", async (req, res) => {
  try {
    const rounds = await Round.find();
    res.json(rounds);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get one round
router.get("/:id", getRound, (req, res) => {
  res.json(res.round);
});

// Create one round
router.post("/", async (req, res) => {
  const round = new Round(req.body);

  try {
    const newRound = await round.save();
    res.status(201).json(newRound);
  } catch (e) {
    res.status(400);
  }
});

// Update one round
router.patch("/:id", getRound, async (req, res) => {
  if (req.body.deals != null) {
    res.round.deals = req.body.deals;
  }

  try {
    const updatedRound = await res.round.save();
    res.json(res.round);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Delete one round
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

router.post;
module.exports = router;
