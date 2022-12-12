import * as mongoose from 'mongoose'

const playerCardQualitySchema = new mongoose.Schema({
  winRate: { type: Number, required: true },
  cardsKey: { type: String, required: true },
  playerAmount: { type: Number, required: true },
  iterations: { type: Number, required: true },
})

export default mongoose.model('PlayerCardQuality', playerCardQualitySchema)
