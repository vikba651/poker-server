import * as mongoose from 'mongoose'

const playerCardQualitySchema = new mongoose.Schema({
  winRate: { type: Number, required: true },
  lowCard: { type: String, required: true },
  highCard: { type: String, required: true },
  suited: { type: Boolean, required: true },
  playerAmount: { type: Number, required: true },
  iterations: { type: Number, required: true, default: 10000 },
})

export default mongoose.model('PlayerCardQuality', playerCardQualitySchema)
