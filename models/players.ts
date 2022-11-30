import { Schema, model } from 'mongoose'

const playerSchema = new Schema({
  name: String,
  roundIds: [String],
  createDate: {
    type: Date,
    default: Date.now,
  },
})

export const PlayerModel = model('Player', playerSchema)
