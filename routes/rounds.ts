import { Router } from 'express'
import { Card, Deal, Player, PlayerCards, Round, Session } from '../types/round'
import { RoundModel } from '../models/rounds'
import PlayerCardQualityModel from '../models/statistics'
import { getPlayerCardsKey } from '../statistics/simulations'
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

router.get('/roundSummary/:id/', getRound, async (req: any, res: any) => {
  const players = getPlayers(res)
  const playerHandQualitiesQuery = await queryPlayerHandQualities(res)

  let userSummaries: UserSummary[] = players.map((player) => {
    const userSummary = {
      name: player,
      handSummary: getHandResultSummary(req, res, player),
      qualities: getPlayerCardQualities(res, playerHandQualitiesQuery, player),
      //Rename to getWorstHandResultPlayer
      worstDeal: getWorstHandResultPlayer(req, res, player),
      bestDeal: getBestHandResultPlayer(req, res, player),
    }
    // See if this modifies all user summaries so only last shows.
    return userSummary
  })

  const roundStatistic: RoundStatistics = {
    userSummaries,
    deals: getDealSummary(req, res, playerHandQualitiesQuery),
  }
  res.json(roundStatistic)
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
    deal.playerCards.forEach((playerCards) => {
      if (playerCards.cards.length == 2) {
        playerCardKeys.push(getPlayerCardsKey(playerCards.cards))
      }
    })
  })

  let playerHandQualitiesQuery: any = null

  try {
    playerHandQualitiesQuery = await PlayerCardQualityModel.find({
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
    const playerCards = deal.playerCards.find((playerCards: any) => {
      return playerCards.name == player
    })
    if (!!playerCards && playerCards.cards.length == 2) {
      const playerCardQuality = playerHandQualitiesQuery.find((queryElement: any) => {
        return (
          queryElement.cardsKey == getPlayerCardsKey(playerCards.cards) &&
          queryElement.playerAmount == deal.playerCards.length
        )
      })
      if (!!playerCardQuality) {
        playerCardQualities.push(playerCardQuality.winRate)
      } else {
        console.log(`Missing simulations for ${getPlayerCardsKey(playerCards.cards)}`)
      }
    }
  })
  return playerCardQualities
}

function getBestHandResultDeal(playerCardsSummaries: PlayerCardsSummary[]) {
  if (playerCardsSummaries.length) {
    const bestHandResult = playerCardsSummaries.reduce((a, b) => {
      if (a.score > b.score) return a
      return b
    })
    const bestHands = playerCardsSummaries.filter((playerCardsSummary: PlayerCardsSummary) => {
      return playerCardsSummary.score === bestHandResult.score
    })
    return bestHands
  }
  return playerCardsSummaries //bestHands
}

function getBestHandResultPlayer(req: any, res: any, player: string) {
  let handResults: HandResult[] = []

  res.round.deals.forEach((deal: Deal) => {
    const playerCard = deal.playerCards.find((playerCards: any) => {
      return playerCards.name == player
    })
    if (!!playerCard && playerCard.cards.length == 2 && deal.tableCards.length >= 3) {
      handResults.push(getHandResult(playerCard.cards.concat(deal.tableCards)))
    }
  })
  if (handResults.length) {
    let bestHandResult = handResults.reduce(function (a, b) {
      if (a.score > b.score) return a
      return b
    })
    return bestHandResult
  }
  let bestHandResult: HandResult = {
    hand: '',
    quads: [],
    triples: [],
    pairs: [],
    cards: [],
    dealtCards: [],
    score: 0,
  }
  return bestHandResult
}

function getWorstHandResultPlayer(req: any, res: any, player: string): HandResult {
  let handResults: HandResult[] = []

  res.round.deals.forEach((deal: Deal) => {
    const playerCard = deal.playerCards.find((playerCards) => {
      return playerCards.name == player
    })
    if (!!playerCard && playerCard.cards.length == 2 && deal.tableCards.length >= 3) {
      handResults.push(getHandResult(playerCard.cards.concat(deal.tableCards)))
    }
  })
  if (handResults.length) {
    let worstHandResult = handResults.reduce(function (a, b) {
      if (a.score < b.score) return a
      return b
    })
    return worstHandResult
  }
  let worstHandResult: HandResult = {
    hand: '',
    quads: [],
    triples: [],
    pairs: [],
    cards: [],
    dealtCards: [],
    score: 0,
  }
  return worstHandResult
}

function getDealSummary(req: any, res: any, playerHandQualitiesQuery: any): DealSummary[] {
  let deals: DealSummary[] = []

  res.round.deals.forEach((deal: Deal) => {
    let playerCardsSummaries: PlayerCardsSummary[] = []

    deal.playerCards.forEach((playerCards: PlayerCards) => {
      if (!!playerCards && playerCards.cards.length == 2) {
        let handQuality: number = 0
        const playerCardQuality = playerHandQualitiesQuery.find((queryElement: any) => {
          return (
            queryElement.cardsKey == getPlayerCardsKey(playerCards.cards) &&
            queryElement.playerAmount == deal.playerCards.length
          )
        })
        if (!!playerCardQuality) {
          handQuality = playerCardQuality.winRate
        } else {
          console.log(`Missing simulations for ${getPlayerCardsKey(playerCards.cards)}`)
        }
        if (deal.tableCards.length >= 3) {
          const handResult = getHandResult(playerCards.cards.concat(deal.tableCards))

          const playerCardsSummary: PlayerCardsSummary = {
            name: playerCards.name,
            cards: playerCards.cards,
            hand: handResult.hand,
            quads: handResult.quads,
            triples: handResult.triples,
            pairs: handResult.pairs,
            dealtCards: handResult.dealtCards,
            score: handResult.score,
            handQuality: handQuality,
          }
          playerCardsSummaries.push(playerCardsSummary)
        } else {
          const playerCardsSummary: PlayerCardsSummary = {
            name: playerCards.name,
            cards: playerCards.cards,
            hand: '',
            quads: [],
            triples: [],
            pairs: [],
            dealtCards: [],
            score: 0,
            handQuality: handQuality,
          }
          playerCardsSummaries.push(playerCardsSummary)
        }
      }
    })
    if (playerCardsSummaries.length) {
      const dealSummary: DealSummary = {
        winningHands: getBestHandResultDeal(playerCardsSummaries),
        playerCards: playerCardsSummaries,
        tableCards: deal.tableCards,
      }

      deals.push(dealSummary)
    }
  })
  return deals
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

// Get one round
router.get('/:id', getRound, async (req: any, res: any) => {
  res.json(res.round)
})

// // Create one round
// router.post('/', async (req: any, res: any) => {
//   const round = new RoundModel(req.body)

//   try {
//     const newRound = await round.save()
//     res.status(200).json(newRound)
//   } catch (e: any) {
//     res.status(400)
//   }
// })

// // Update one round
// router.patch('/:id', getRound, async (req: any, res: any) => {
//   if (req.body.deals != null) {
//     res.round.deals = req.body.deals
//   }

//   try {
//     const updatedRound = await res.round.save()
//     res.json(res.round)
//   } catch (e: any) {
//     res.status(400).json({ message: e.message })
//   }
// })

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

  const deals: Deal[] = round.deals.map((deal) => {
    const filteredPlayerCards = deal.playerCards.map((playerCards) => {
      return { name: playerCards.name ? playerCards.name : '', cards: filterEmptyCards(playerCards.cards) }
    })
    const filteredTableCards: Card[] = filterEmptyCards(deal.tableCards)

    const filteredDeal: Deal = {
      playerCards: filteredPlayerCards,
      tableCards: filteredTableCards,
    }
    return filteredDeal
  })
  res.round = { id: round.id, deals, startTime: round.startTime }
  next()
}

function filterEmptyCards(cards: any): Card[] {
  let filteredCards: Card[] = []
  cards.forEach((card: any) => {
    if (card.suit && card.rank) {
      filteredCards.push({ suit: card.suit, rank: card.rank })
    }
  })
  return filteredCards
}

// router.post
export default router
