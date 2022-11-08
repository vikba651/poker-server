const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema({
  // creator: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Player",
  //   //required: true,
  // },
  // players: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Player",
  //   },
  // ],
  deals: [
    [
      {
        playerCards: [
          {
            suite: {
              type: String,
              required: true,
            },
            rank: {
              type: String,
              required: true,
            },
          },
        ],
        tableCards: [
          {
            suite: {
              type: String,
              required: true,
            },
            rank: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],
  ],
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

module.exports = mongoose.model("Round", roundSchema);
