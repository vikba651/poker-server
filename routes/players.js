const express = require("express");
const router = express.Router();
const Player = require("../models/players");

// Get all players
router.get("/", async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Get one player
router.get("/:id", getPlayer, (req, res) => {
  res.json(res.player);
});

// Create one player
router.post("/", async (req, res) => {
  const player = new Player(req.body);

  try {
    const newPlayer = await player.save();
    res.status(201).json(newPlayer);
  } catch (e) {
    res.status(400);
  }
});

// Update one player
router.patch("/:id", getPlayer, async (req, res) => {
  if (req.body.name != null) {
    res.player.name = req.body.name;
  }

  try {
    const updatedPlayer = await res.player.save();
    res.json(res.player);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Delete one player
router.delete("/:id", getPlayer, async (req, res) => {
  try {
    await res.player.remove();
    res.json({ message: "Deleted player" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

async function getPlayer(req, res, next) {
  let player;
  try {
    player = await Player.findById(req.params.id);
    if (player == null) {
      return res.status(404).json({ message: "Cannot find player" });
    }
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }

  res.player = player;
  next();
}

router.post;
module.exports = router;
