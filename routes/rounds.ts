import { Router } from 'express'
import { Card, Deal, Player, PlayerCards, Round, Session } from '../types/round'
import { RoundModel } from '../models/rounds'
import PlayerCardQuality from '../models/statistics'
import { getPlayerCardsKey } from '../statistics/simulations'
import { table } from 'console'
import { getHandResult } from '../statistics/poker-logic'
import { HandResult } from '../types/statistics'

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

router.get('/playerCardQuality/:id/:playerAmount/:name', getRound, async (req: any, res: any) => {
  let playerCardKeys: string[] = []

  res.round.deals.forEach((deal: Deal) => {
    deal.playerCards.forEach((playerCards: any) => {
      playerCardKeys.push(getPlayerCardsKey(playerCards.cards))
    })
  })

  let queryResult: any = null

  try {
    queryResult = await PlayerCardQuality.find({
      cardsKey: {
        $in: playerCardKeys,
      },
      playerAmount: parseInt(req.params.playerAmount),
    })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }

  let playerCardQualities: number[] = []

  res.round.deals.forEach((deal: Deal) => {
    const playerCard = deal.playerCards.find((playerCards: any) => {
      return playerCards.name == req.params.name
    })
    if (!!playerCard) {
      const playerCardQuality = queryResult.find((queryElement: any) => {
        return queryElement.cardsKey == getPlayerCardsKey(playerCard.cards)
      })
      if (!!playerCardQuality) {
        playerCardQualities.push(playerCardQuality.winRate)
      } else {
        console.log(`Missing simulations for ${getPlayerCardsKey(playerCard.cards)}`)
      }
    }
  })
  res.json(playerCardQualities)
})

router.get('/bestHandPlayer/:id/:name', getRound, async (req: any, res: any) => {
  let handQualities: HandResult[] = []

  res.round.deals.forEach((deal: Deal) => {
    const playerCard = deal.playerCards.find((playerCards: any) => {
      return playerCards.name == req.params.name
    })
    if (!!playerCard && playerCard.cards.length == 2 && deal.tableCards.length >= 3) {
      handQualities.push(getHandResult(playerCard.cards.concat(deal.tableCards)))
    }
  })
  let bestHandResult = handQualities.reduce(function (a, b) {
    if (a.score > b.score) return a
    return b
  })
  res.json(bestHandResult)
})

router.get('/worstHandPlayer/:id/:name', getRound, async (req: any, res: any) => {
  let handQualities: HandResult[] = []

  res.round.deals.forEach((deal: Deal) => {
    const playerCard = deal.playerCards.find((playerCards: any) => {
      return playerCards.name == req.params.name
    })
    if (!!playerCard && playerCard.cards.length == 2 && deal.tableCards.length >= 3) {
      handQualities.push(getHandResult(playerCard.cards.concat(deal.tableCards)))
    }
  })
  let worstHandResult = handQualities.reduce(function (a, b) {
    if (a.score < b.score) return a
    return b
  })
  res.json(worstHandResult)
})

router.get('/handSummary/:id/:name', getRound, async (req: any, res: any) => {
  let handsSummary = new Map([
    ['Straight flush', 0],
    ['Four of a kind', 0],
    ['Full house', 0],
    ['Flush', 0],
    ['Straight', 0],
    ['Three of a kind', 0],
    ['Two pairs', 0],
    ['Pair', 0],
    ['High card', 0],
  ])

  res.round.deals.forEach((deal: Deal) => {
    const playerCard = deal.playerCards.find((playerCards: any) => {
      return playerCards.name == req.params.name
    })
    if (!!playerCard && playerCard.cards.length == 2 && deal.tableCards.length >= 3) {
      const HandResult: HandResult = getHandResult(playerCard.cards.concat(deal.tableCards))
      handsSummary.set(HandResult.hand, handsSummary.get(HandResult.hand)! + 1)
    }
  })
  res.json(Object.fromEntries(handsSummary))
})

// (e: any, queryResult: any) => {
//   if (e) {
//     res.status(500).json({ message: e.message })
//   }
//   res.json(queryResult)
// }

// Get one round
router.get('/:id', getRound, async (req: any, res: any) => {
  let playerCardKeys: string[] = []

  res.round.deals.forEach((deal: Deal) => {
    deal.playerCards.forEach((playerCards: any) => {
      playerCardKeys.push(getPlayerCardsKey(playerCards.cards))
    })
  })
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
