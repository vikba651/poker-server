import { Router } from 'express'
import { Card, Deal, Player, PlayerCards, Round, Session } from '../types/round'
import { RoundModel } from '../models/rounds'
import PlayerCardQuality from '../models/statistics'
import { getPlayerCardsKey } from '../statistics/simulations'
import { table } from 'console'
import { getHandResult } from '../statistics/poker-logic'
import {
  DealSummary,
  HandResult,
  HandSummary,
  PlayerCardsSummary,
  RoundStatistics,
  UserSummary,
} from '../types/statistics'
import { hands } from '../statistics/constant'

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

function getPlayers(res: any) {
  let players: string[] = []

  res.round.deals.forEach((deal: Deal) => {
    deal.playerCards.forEach((playerCards: any) => {
      if (!players.includes(playerCards.name)) {
        players.push(playerCards.name)
      }
    })
  })
  return players
}

async function queryPlayerHandQualities(res: any) {
  let playerCardKeys: string[] = []
  let playerAmounts: number[] = []

  res.round.deals.forEach((deal: Deal) => {
    if (!playerAmounts.includes(deal.playerCards.length) && deal.playerCards.length !== 0) {
      playerAmounts.push(deal.playerCards.length)
    }
    deal.playerCards.forEach((playerCards: any) => {
      playerCardKeys.push(getPlayerCardsKey(playerCards.cards))
    })
  })

  let playerHandQualitiesQuery: any = null

  try {
    playerHandQualitiesQuery = await PlayerCardQuality.find({
      cardsKey: {
        $in: playerCardKeys,
      },
      playerAmount: {
        $in: playerAmounts,
      },
    })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }

  return playerHandQualitiesQuery
}

function getPlayerCardQualities(res: any, playerHandQualitiesQuery: any, player: string): number[] {
  let playerCardQualities: number[] = []

  res.round.deals.forEach((deal: Deal) => {
    const playerCard = deal.playerCards.find((playerCards: any) => {
      return playerCards.name == player
    })
    if (!!playerCard) {
      const playerCardQuality = playerHandQualitiesQuery.find((queryElement: any) => {
        return (
          queryElement.cardsKey == getPlayerCardsKey(playerCard.cards) &&
          queryElement.playerAmount == deal.playerCards.length
        )
      })
      if (!!playerCardQuality) {
        playerCardQualities.push(playerCardQuality.winRate)
      } else {
        console.log(`Missing simulations for ${getPlayerCardsKey(playerCard.cards)}`)
      }
    }
  })
  return playerCardQualities
}

router.get('/roundSummary/:id/', getRound, async (req: any, res: any) => {
  const players = getPlayers(res)
  const playerHandQualitiesQuery = await queryPlayerHandQualities(res)

  let emptyDeal: HandResult = {
    hand: '',
    quads: [],
    triples: [],
    pairs: [],
    cards: [],
    dealtCards: [],
    score: 0,
  }

  let userSummary: UserSummary = {
    name: '',
    handSummary: {
      straightFlushes: 0,
      quads: 0,
      fullHouses: 0,
      flushes: 0,
      straights: 0,
      triples: 0,
      twoPairs: 0,
      pairs: 0,
      highCards: 0,
    },
    qualities: [],
    worstDeal: emptyDeal,
    bestDeal: emptyDeal,
  }

  let userSummaries: UserSummary[] = []

  players.forEach((player) => {
    userSummary = {
      name: player,
      handSummary: getHandResultSummary(req, res, player),
      qualities: getPlayerCardQualities(res, playerHandQualitiesQuery, player),
      worstDeal: getWorstHandResult(req, res, player),
      bestDeal: getBestHandResult(req, res, player),
    }
    // See if this modifies all user summaries so only last shows.
    userSummaries.push(userSummary)
  })

  // let deals: DealSummary[] = []

  // res.round.deal.forEach((deal: Deal) => {
  //   let playerCardSummary: PlayerCardsSummary = {
  //     name: '',
  //     cards: [],
  //     hand: '',
  //     quads: [],
  //     triples: [],
  //     pairs: [],
  //     dealtCards: [],
  //     score: 0,
  //   }

  //   deal.playerCards.forEach((playerCard: PlayerCards) => {
  //     if (!!playerCard && playerCard.cards.length == 2 && deal.tableCards.length >= 3) {
  //       const handResult = getHandResult(playerCard.cards.concat(deal.tableCards))

  //       playerCardSummary = {
  //         name: playerCard.name,
  //         cards: playerCard.cards,
  //         hand: handResult.hand,
  //         quads: handResult.quads,
  //         triples: handResult.triples,
  //         pairs: handResult.pairs,
  //         dealtCards: handResult.dealtCards,
  //         score: handResult.score,
  //       }
  //       return playerCardSummary
  //     }
  //   })

  //   let dealSummary: DealSummary = {
  //     playerCards: playerCardSummary,
  //     tableCards: deal.tableCards,
  //   }

  //   return
  // })

  const roundStatistic: RoundStatistics = {
    userSummaries,
  }
  res.json(roundStatistic)
})

function getBestHandResult(req: any, res: any, player: string) {
  let handQualities: HandResult[] = []

  res.round.deals.forEach((deal: Deal) => {
    const playerCard = deal.playerCards.find((playerCards: any) => {
      return playerCards.name == player
    })
    if (!!playerCard && playerCard.cards.length == 2 && deal.tableCards.length >= 3) {
      handQualities.push(getHandResult(playerCard.cards.concat(deal.tableCards)))
    }
  })
  let bestHandResult = handQualities.reduce(function (a, b) {
    if (a.score > b.score) return a
    return b
  })
  return bestHandResult
}

function getWorstHandResult(req: any, res: any, player: string) {
  let handQualities: HandResult[] = []

  res.round.deals.forEach((deal: Deal) => {
    const playerCard = deal.playerCards.find((playerCards: any) => {
      return playerCards.name == player
    })
    if (!!playerCard && playerCard.cards.length == 2 && deal.tableCards.length >= 3) {
      handQualities.push(getHandResult(playerCard.cards.concat(deal.tableCards)))
    }
  })
  let bestHandResult = handQualities.reduce(function (a, b) {
    if (a.score < b.score) return a
    return b
  })
  return bestHandResult
}

// router.get('/bestHandPlayer/:id/', getRound, async (req: any, res: any) => {
//   let handQualities: HandResult[] = []

//   res.round.deals.forEach((deal: Deal) => {
//     const playerCard = deal.playerCards.find((playerCards: any) => {
//       return playerCards.name == player
//     })
//     if (!!playerCard && playerCard.cards.length == 2 && deal.tableCards.length >= 3) {
//       handQualities.push(getHandResult(playerCard.cards.concat(deal.tableCards)))
//     }
//   })
//   let bestHandResult = handQualities.reduce(function (a, b) {
//     if (a.score > b.score) return a
//     return b
//   })
//   return bestHandResult
//   res.json(getBestHand(req: any, res: any, ))
// })

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

function handsSummaryToObject(handSummaryMap: Map<string, number>): HandSummary {
  let handSummary: HandSummary = {
    straightFlushes: 0,
    quads: 0,
    fullHouses: 0,
    flushes: 0,
    straights: 0,
    triples: 0,
    twoPairs: 0,
    pairs: 0,
    highCards: 0,
  }
  hands.forEach((hand) => {
    switch (hand) {
      case 'Straight flush':
        handSummary.straightFlushes = handSummaryMap.get(hand) ?? 0
        break
      case 'Four of a kind':
        handSummary.quads = handSummaryMap.get(hand) ?? 0
        break
      case 'Full house':
        handSummary.fullHouses = handSummaryMap.get(hand) ?? 0
        break
      case 'Flush':
        handSummary.flushes = handSummaryMap.get(hand) ?? 0
        break
      case 'Straight':
        handSummary.straights = handSummaryMap.get(hand) ?? 0
        break
      case 'Three of a kind':
        handSummary.triples = handSummaryMap.get(hand) ?? 0
        break
      case 'Two pairs':
        handSummary.twoPairs = handSummaryMap.get(hand) ?? 0
        break
      case 'Pair':
        handSummary.pairs = handSummaryMap.get(hand) ?? 0
        break
      case 'High card':
        handSummary.highCards = handSummaryMap.get(hand) ?? 0
        break
      default:
        throw `Hand summary Map to Object got non existing hand: ${hand}`
        break
    }
  })
  return handSummary
}

function getHandResultSummary(req: any, res: any, player: string) {
  let handResultSummary = new Map([
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
      return playerCards.name == player
    })
    if (!!playerCard && playerCard.cards.length == 2 && deal.tableCards.length >= 3) {
      const HandResult: HandResult = getHandResult(playerCard.cards.concat(deal.tableCards))
      handResultSummary.set(HandResult.hand, handResultSummary.get(HandResult.hand)! + 1)
    }
  })
  return handsSummaryToObject(handResultSummary)
}

router.get('/handResultsSummary/:id/:name', getRound, async (req: any, res: any) => {
  const players = getPlayers(res)
  res.json(getHandResultSummary(req, res, players[0]))
})

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
