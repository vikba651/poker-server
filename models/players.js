const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  // deals: {},
  name: {
    type: String,
    required: true,
  },
  createDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

module.exports = mongoose.model("Player", playerSchema);
