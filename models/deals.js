const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema({
  cards: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: true,
    },
  ],
  round: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Round",
    required: true,
  },
});

module.exports = mongoose.model("Deal", dealSchema);
