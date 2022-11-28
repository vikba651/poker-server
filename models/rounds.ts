import { model, Schema } from 'mongoose'

const CardSchema = new Schema({
  suit: String,
  value: String,
})

const PlayerCardsSchema = new Schema({
  name: String,
  cards: [CardSchema],
})

const DealSchema = new Schema({
  id: Number,
  playerCards: [PlayerCardsSchema],
  tableCards: [CardSchema],
})

const RoundSchema = new Schema({
  _id: String,
  deals: [DealSchema],
  startTime: Number,
})
export const DealModel = model('Deal', DealSchema)

export const RoundModel = model('Round', RoundSchema)
