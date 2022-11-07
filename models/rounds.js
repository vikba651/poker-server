const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema({
  // deals: {},
  name: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

module.exports = mongoose.model("Round", roundSchema);
