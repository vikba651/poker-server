const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  suit: {
    type: String,
    required: true,
  },
  rank: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Card", cardSchema);
