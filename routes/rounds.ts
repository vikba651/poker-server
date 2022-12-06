import { Router } from 'express'
import { Card, Deal, Player, PlayerCards, Round, Session } from '../types/session'
import { RoundModel } from '../models/rounds'
import PlayerCardQuality from '../models/statistics'
import { ranks, suits } from '../statistics/constant'

const router = Router()
// Get all rounds
router.get('/', async (req: any, res: any) => {
  try {
    const rounds = await RoundModel.find()
    res.json(rounds)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

async function getPlayerCardQualities(res: any) {
  let playerCardQualities: PlayerCardQualities[] = []

  if (res.round.deals != null) {
    res.round.deals.forEach(async (deal: Deal) => {
      deal.playerCards.forEach(async (playerCard: PlayerCards) => {
        let lowCard =
          ranks.indexOf(playerCard.cards[0].suit) < suits.indexOf(playerCard.cards[0].suit)
            ? playerCard.cards[0].value
            : playerCard.cards[1].value
        let highCard =
          ranks.indexOf(playerCard.cards[0].suit) > suits.indexOf(playerCard.cards[0].suit)
            ? playerCard.cards[0].value
            : playerCard.cards[1].value

        console.log(lowCard)
        console.log(highCard)

        let playerAmount = 4 // change to deal.playerCards.length, simulations are currently missing
        let playerCardQuality = await PlayerCardQuality.findOne({ lowCard, highCard, playerAmount })
        console.log(playerCardQuality)
        // Validate if this is a successful query
        if (playerCardQuality) {
          if (
            playerCardQualities.find((elem) => {
              elem.name == playerCard.name
            })
          ) {
            playerCardQualities
              .find((elem) => {
                elem.name == playerCard.name
              })
              ?.qualities.push(playerCardQuality.winRate)
          } else {
            let tempPlayerCardQuality: PlayerCardQualities = {
              name: playerCard.name,
              qualities: [playerCardQuality.winRate],
            }
            playerCardQualities.push(tempPlayerCardQuality)
          }
        } else {
          res.status(400).json({ message: 'Needs to be simulated' })
        }
      })
    })
  }
  return playerCardQualities
}
interface PlayerCardQualities {
  name: string
  qualities: number[]
}

// Get one round
router.get('/:id', getRound, async (req: any, res: any) => {
  let playerCardQualities = await getPlayerCardQualities(res)
  console.log(playerCardQualities)
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
