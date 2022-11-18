import * as mongoose from 'mongoose'

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
})

export default mongoose.model('Player', playerSchema)
