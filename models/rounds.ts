import { model, Schema } from 'mongoose'

const CardSchema = new Schema({
  suit: String,
  rank: String,
})

const PlayerCardsSchema = new Schema({
  name: String,
  cards: [CardSchema],
})

const DealSchema = new Schema({
  playerCards: [PlayerCardsSchema],
  tableCards: [CardSchema],
})

const RoundEarnings = new Schema({
  name: String,
  earning: Number,
})

const RoundSchema = new Schema({
  _id: String,
  deals: [DealSchema],
  earnings: [RoundEarnings],
  startTime: Number,
})

export const RoundModel = model('Round', RoundSchema)
