import { model, Schema } from 'mongoose'

const playerCardQualitySchema = new Schema({
  winRate: { type: Number, required: true },
  percentile: { type: Number, required: true },
  cardsKey: { type: String, required: true },
  playerAmount: { type: Number, required: true },
  iterations: { type: Number, required: true },
})

export const PlayerCardQualityModel = model('PlayerCardQuality', playerCardQualitySchema)
