import { getHandQuality } from './poker-logic'
import { cardStringToArray, generateDealGiven } from './card-generation'
import { cardArrayToString, handQualityToString } from './to-strings'
import { PlayerCardQualityType } from '../types/statistics'
import { Card, Deal, Player, PlayerCards, Round, Session } from '../types/session'
import PlayerCardQuality from '../models/statistics'
import { ranks, suitEmoji, suits } from './constant'

export function getPlayerCardsKey(playerCards: Card[]): string {
  let highCard =
    ranks.indexOf(playerCards[0].rank) < ranks.indexOf(playerCards[1].rank) ? playerCards[0].rank : playerCards[1].rank
  let lowCard =
    ranks.indexOf(playerCards[0].rank) > ranks.indexOf(playerCards[1].rank) ? playerCards[0].rank : playerCards[1].rank
  let suited = playerCards[0].suit === playerCards[1].suit

  return lowCard + highCard + (suited ? 's' : '')
}

export async function simulateAllPlayerCards(playerAmount: number, iterations: number) {
  console.log('Lets simulate some')
  ranks.forEach((firstRank) => {
    ranks.forEach((secondRank) => {
      if (ranks.indexOf(firstRank) <= ranks.indexOf(secondRank)) {
        simulatePlayerCards(cardStringToArray(`${firstRank}H ${secondRank}C`), playerAmount, iterations)
      }
    })
  })

  ranks.forEach((firstRank) => {
    ranks.forEach((secondRank) => {
      if (ranks.indexOf(firstRank) < ranks.indexOf(secondRank)) {
        simulatePlayerCards(cardStringToArray(`${firstRank}H ${secondRank}H`), playerAmount, iterations)
      }
    })
  })
}

export async function simulatePlayerCards(playerCards: Card[], playerAmount: number, iterations: number) {
  let time = Date.now()
  let wins = 0

  for (let i = 0; i < iterations; i++) {
    let deal = generateDealGiven(playerCards, playerAmount)
    const givenHand = deal[0]
    let handQualities = deal.map((cards) => {
      return getHandQuality(cards)
    })

    handQualities.sort((a, b) => {
      return a.score - b.score
    })

    let winScore = handQualities.slice(-1)[0].score
    let winningHandQualities = handQualities.filter((handQuality) => {
      return handQuality.score === winScore
    })

    if (
      winningHandQualities.filter((handQuality) => {
        return handQuality.dealtCards === givenHand
      }).length
    ) {
      wins += 1 / winningHandQualities.length
    }
  }
  const cardsKey = getPlayerCardsKey(playerCards)

  let playerCardQuality = await PlayerCardQuality.findOne({ cardsKey, playerAmount })

  playerCardQuality = !!playerCardQuality
    ? playerCardQuality
    : new PlayerCardQuality({
        winRate: wins / iterations,
        cardsKey,
        playerAmount,
        iterations,
      })

  const newWinRate = wins / iterations
  playerCardQuality.winRate =
    (playerCardQuality.winRate * playerCardQuality.iterations + newWinRate * iterations) /
    (iterations + playerCardQuality.iterations)
  playerCardQuality.iterations += iterations

  const newPlayerCardQuality = await playerCardQuality.save()
  console.log(
    `Completed in ${Date.now() - time} ms. ${playerCards[1].rank}${suitEmoji[suits.indexOf(playerCards[1].suit)]} ${
      playerCards[0].rank
    }${suitEmoji[suits.indexOf(playerCards[0].suit)]},  playerAmount: ${playerCardQuality.playerAmount}, iterations: ${
      playerCardQuality.iterations
    }, Win Rate: ${playerCardQuality.winRate}`
  )
}
