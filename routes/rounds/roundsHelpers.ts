import { RoundModel } from '../../models/rounds'
import { PlayerCardQualityModel } from '../../models/statistics'
import { hands } from '../../statistics/constant'
import { getHandResult } from '../../statistics/poker-logic'
import { getPlayerCardsKey } from '../../statistics/simulations'
import { Card, Deal, PlayerCards } from '../../types/round'
import { DealSummary, HandResult, HandSummary, PlayerCardsSummary } from '../../types/statistics'

export function getPlayers(res: any) {
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

export async function queryPlayerHandQualities(res: any) {
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

export function getPlayerCardQualities(res: any, playerHandQualitiesQuery: any, player: string): number[] {
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

export function getBestHandResultDeal(playerCardsSummaries: PlayerCardsSummary[]) {
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

export function getBestHandIndexPlayer(req: any, res: any, player: string): number {
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
    const bestHandIndex = handResults.reduce((maxIndex, currentObject, currentIndex, array) => {
      if (currentObject.score > array[maxIndex].score) {
        return currentIndex
      } else {
        return maxIndex
      }
    }, 0)
    return bestHandIndex
  }
  return -1
}

export function getWorstHandIndexPlayer(req: any, res: any, player: string): number {
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
    const worstHandIndex = handResults.reduce((maxIndex, currentObject, currentIndex, array) => {
      if (currentObject.score < array[maxIndex].score) {
        return currentIndex
      } else {
        return maxIndex
      }
    }, 0)
    return worstHandIndex
  }
  return -1
}

export function getDealSummary(req: any, res: any, playerHandQualitiesQuery: any): DealSummary[] {
  let deals: DealSummary[] = []

  res.round.deals.forEach((deal: Deal) => {
    let playerCardsSummaries: PlayerCardsSummary[] = []

    deal.playerCards.forEach((playerCards: PlayerCards) => {
      if (!!playerCards && playerCards.cards.length == 2) {
        let winRate = 0
        let percentile = 0
        const playerCardQuality = playerHandQualitiesQuery.find((queryElement: any) => {
          return (
            queryElement.cardsKey == getPlayerCardsKey(playerCards.cards) &&
            queryElement.playerAmount == deal.playerCards.length
          )
        })
        if (!!playerCardQuality) {
          winRate = playerCardQuality.winRate
          percentile = playerCardQuality.percentile
        } else {
          // TODO if missing simulate, add to database and add to playerCardQuality
          console.log(`Missing simulations for ${getPlayerCardsKey(playerCards.cards)}`)
        }
        if (deal.tableCards.length >= 3) {
          const handResult = getHandResult(playerCards.cards.concat(deal.tableCards))

          const playerCardsSummary: PlayerCardsSummary = {
            name: playerCards.name,
            cards: playerCards.cards,
            bestCards: handResult.bestCards,
            hand: handResult.hand,
            quads: handResult.quads,
            triples: handResult.triples,
            pairs: handResult.pairs,
            dealtCards: handResult.dealtCards,
            score: handResult.score,
            winRate: winRate,
            percentile: percentile,
          }
          playerCardsSummaries.push(playerCardsSummary)
        } else {
          const playerCardsSummary: PlayerCardsSummary = {
            name: playerCards.name,
            cards: playerCards.cards,
            bestCards: [],
            hand: '',
            quads: [],
            triples: [],
            pairs: [],
            dealtCards: [],
            score: 0,
            winRate: 0,
            percentile: 0,
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

export function getHandResultSummary(req: any, res: any, player: string) {
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

export function handsSummaryToObject(handSummaryMap: Map<string, number>): HandSummary {
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

export async function getRound(req: any, res: any, next: any) {
  let round
  try {
    round = await RoundModel.findById(req.params.id)
    if (round == null) {
      return res.status(404).json({ message: 'Cannot find round' })
    }
  } catch (e: any) {
    return res.status(500).json({ message: e.message })
  }
  //res.roundModel is a mongoose object
  res.roundModel = round

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
  // res.round is a javascript object without mongoose methods
  res.round = { ...round, deals }
  next()
}

export function filterEmptyCards(cards: any): Card[] {
  let filteredCards: Card[] = []
  cards.forEach((card: any) => {
    if (card.suit && card.rank) {
      filteredCards.push({ suit: card.suit, rank: card.rank })
    }
  })
  return filteredCards
}
