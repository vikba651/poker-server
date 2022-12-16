import mongoose from 'mongoose'
import { cardStringToArray } from '../statistics/card-generation'
import { simulateAllPlayerCards, simulatePlayerCards } from '../statistics/simulations'

mongoose.connect(`${process.env.DATABASE_URL}`, (error) => {
  if (error) {
    console.log('Could not connect to Mongoose')
  } else {
    console.log('Connected to Mongoose')
  }
})

mongoose.connect(`${process.env.DATABASE_URL}`, async (error: any) => {
  if (error) {
    console.log('Could not connect to Mongoose')
  } else {
    console.log('Connected to Mongoose')
    const playerCardQualities = await simulateAllPlayerCards(4, 100)

    playerCardQualities.forEach((playerCardQuality) => {
      console.log(playerCardQuality.cardsKey, playerCardQuality.percentile, playerCardQuality.winRate)
    })
  }
})
