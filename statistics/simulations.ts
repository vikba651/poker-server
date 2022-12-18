import { getHandResult } from './poker-logic'
import { cardStringToArray, generateDealGiven } from './card-generation'
import { cardArrayToString, handQualityToString } from './to-strings'
import { Card, Deal, Player, PlayerCards, Round, Session } from '../types/round'
import { PlayerCardQuality } from '../types/statistics'
import PlayerCardQualitySchema from '../models/statistics'
import { ranks, suitEmoji, suits } from './constant'
import mongoose from 'mongoose'

export function getPlayerCardsKey(playerCards: Card[]): string {
  let highCard =
    ranks.indexOf(playerCards[0].rank) < ranks.indexOf(playerCards[1].rank) ? playerCards[0].rank : playerCards[1].rank
  let lowCard =
    ranks.indexOf(playerCards[0].rank) > ranks.indexOf(playerCards[1].rank) ? playerCards[0].rank : playerCards[1].rank
  let suited = playerCards[0].suit === playerCards[1].suit

  return lowCard + highCard + (suited ? 's' : '')
}

export async function simulateAllPlayerCards(playerAmount: number, iterations: number) {
  console.log('Simulation started')

  let playerCardQualities: PlayerCardQuality[] = []

  ranks.forEach((firstRank) => {
    ranks.forEach((secondRank) => {
      if (ranks.indexOf(firstRank) <= ranks.indexOf(secondRank)) {
        console.log(`${playerCardQualities.length + 1} / 169`)
        playerCardQualities.push(
          simulatePlayerCards(cardStringToArray(`${firstRank}H ${secondRank}C`), playerAmount, iterations)
        )
      }
    })
  })

  ranks.forEach((firstRank) => {
    ranks.forEach((secondRank) => {
      if (ranks.indexOf(firstRank) < ranks.indexOf(secondRank)) {
        console.log(`${playerCardQualities.length + 1} / 169`)
        playerCardQualities.push(
          simulatePlayerCards(cardStringToArray(`${firstRank}H ${secondRank}H`), playerAmount, iterations)
        )
      }
    })
  })

  playerCardQualities = playerCardQualities.sort((a, b) => {
    return a.winRate - b.winRate
  })

  for (let i = 0; i < playerCardQualities.length; i++) {
    if (i) {
      playerCardQualities[i].percentile = Math.round((100 * (i + 1)) / playerCardQualities.length)
    } else {
      playerCardQualities[i].percentile = 0
    }
  }

  PlayerCardQualitySchema.insertMany(playerCardQualities)
    .then(() => {
      console.log('Simulations added to the database')
    })
    .catch((err) => {
      console.log(err)
    })

  return playerCardQualities
}

export function simulatePlayerCards(playerCards: Card[], playerAmount: number, iterations: number) {
  let time = Date.now()
  let wins = 0

  for (let i = 0; i < iterations; i++) {
    let deal = generateDealGiven(playerCards, playerAmount)
    const givenHand = deal[0]
    let handQualities = deal.map((cards) => {
      return getHandResult(cards)
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

  // let playerCardQuality = await PlayerCardQuality.findOne({ cardsKey, playerAmount })

  // playerCardQuality = !!playerCardQuality
  //   ? playerCardQuality
  //   : new PlayerCardQuality({
  //       winRate: wins / iterations,
  //       cardsKey,
  //       playerAmount,
  //       iterations,
  //     })

  let playerCardQuality: PlayerCardQuality = {
    winRate: wins / iterations,
    percentile: 0,
    cardsKey,
    playerAmount,
    iterations,
  }

  // const newWinRate = wins / iterations
  // playerCardQuality.winRate =
  //   (playerCardQuality.winRate * playerCardQuality.iterations + newWinRate * iterations) /
  //   (iterations + playerCardQuality.iterations)
  // playerCardQuality.iterations += iterations

  console.log(
    `Completed in ${Date.now() - time} ms. ${playerCards[1].rank}${suitEmoji[suits.indexOf(playerCards[1].suit)]} ${
      playerCards[0].rank
    }${suitEmoji[suits.indexOf(playerCards[0].suit)]},  playerAmount: ${playerCardQuality.playerAmount}, iterations: ${
      playerCardQuality.iterations
    }, Win Rate: ${playerCardQuality.winRate}`
  )

  return playerCardQuality
}
