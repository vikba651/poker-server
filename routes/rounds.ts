import { Router } from 'express'
import { Card, Deal, Player, PlayerCards, Round, Session } from '../types/session'
import { RoundModel } from '../models/rounds'
import PlayerCardQuality from '../models/statistics'
import { ranks, suits } from '../statistics/constant'
import { getPlayerCardsKey } from '../statistics/simulations'

const router = Router()
// Get all rounds
router.get('/', async (req: any, res: any) => {
  console.log('here we go')
  try {
    const rounds = await RoundModel.find()
    res.json(rounds)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// router.get('/qualities', async (req: any, res: any) => {
//   try {
//     const qualities = await PlayerCardQuality.find({})
//     res.json(qualities)
//   } catch (e: any) {
//     res.status(500).json({ message: e.message })
//   }
// })

interface PlayerCardQualities {
  name: string
  qualities: number[]
}

// Get one round
router.get('/:id', getRound, async (req: any, res: any) => {
  console.log('Here we go')
  let playerCardKeys = req.round.deals.reduce((deal: Deal, playerCardKeys: string[]) => {
    if (deal.playerCards) {
      return deal.playerCards
        .map((playerCards: PlayerCards) => {
          return getPlayerCardsKey(playerCards.cards)
        })
        .concat(playerCardKeys)
    }

    return playerCardKeys
  }, [])
  console.log(playerCardKeys)
  //let playerCardQualities = await getPlayerCardQualities(res)
  // console.log(playerCardQualities)
  res.json(res.round)
})

// Create one round
router.post('/', async (req: any, res: any) => {
  const round = new RoundModel(req.body)

  try {
    const newRound = await round.save()
    res.status(200).json(newRound)
  } catch (e: any) {
    res.status(400)
  }
})

// Update one round
router.patch('/:id', getRound, async (req: any, res: any) => {
  if (req.body.deals != null) {
    res.round.deals = req.body.deals
  }

  try {
    const updatedRound = await res.round.save()
    res.json(res.round)
  } catch (e: any) {
    res.status(400).json({ message: e.message })
  }
})

// Delete one round
router.delete('/:id', getRound, async (req: any, res: any) => {
  try {
    await res.round.remove()
    res.json({ message: 'Deleted round' })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

async function getRound(req: any, res: any, next: any) {
  let round
  try {
    round = await RoundModel.findById(req.params.id)
    if (round == null) {
      return res.status(404).json({ message: 'Cannot find round' })
    }
  } catch (e: any) {
    return res.status(500).json({ message: e.message })
  }

  res.round = round
  next()
}

// router.post
export default router
