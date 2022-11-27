import { getHandQuality } from './poker-logic'
import { cardStringToArray, generateDealGiven } from './card-generation'
import { cardArrayToString, handQualityToString } from './to-strings'
import PlayerCardQuality from '../models/statistics'
import { Card, ranks, suitEmoji, suits } from './constant'

let score: any = {
  win: 1,
  lose: 0,
}

export async function simulateAllPlayerCards(playerAmount: number) {
  console.log('Lets simulate some')
  ranks.forEach((firstRank) => {
    ranks.forEach((secondRank) => {
      if (ranks.indexOf(firstRank) <= ranks.indexOf(secondRank)) {
        simulatePlayerCards(cardStringToArray(`${firstRank}H ${secondRank}C`), playerAmount)
      }
    })
  })

  ranks.forEach((firstRank) => {
    ranks.forEach((secondRank) => {
      if (ranks.indexOf(firstRank) < ranks.indexOf(secondRank)) {
        simulatePlayerCards(cardStringToArray(`${firstRank}H ${secondRank}H`), playerAmount)
      }
    })
  })
}

export async function simulatePlayerCards(playerCards: Card[], playerAmount: number) {
  let time = Date.now()
  let wins = 0
  let iterations = 10000

  for (let i = 0; i < iterations; i++) {
    let deal = generateDealGiven(playerCards, playerAmount)
    const givenHand = deal[0]
    let handQualities = deal.map((cards) => {
      return getHandQuality(cards)
    })

    handQualities.sort((a, b) => {
      return a.score - b.score
    })

    // handQualities.forEach((handQuality) => {
    //   console.log('-----')
    //   handQualityToString(handQuality)
    // })

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
  let highCard =
    ranks.indexOf(playerCards[0].rank) < ranks.indexOf(playerCards[1].rank) ? playerCards[0].rank : playerCards[1].rank
  let lowCard =
    ranks.indexOf(playerCards[0].rank) > ranks.indexOf(playerCards[1].rank) ? playerCards[0].rank : playerCards[1].rank

  let playerCardQualities = await PlayerCardQuality.find({ lowCard, highCard, playerAmount })
  let playerCardQuality

  if (playerCardQualities.length) {
    playerCardQuality = playerCardQualities[0]
  } else {
    playerCardQuality = new PlayerCardQuality({
      winRate: wins / iterations,
      highCard,
      lowCard,
      suited: playerCards[0].suit === playerCards[1].suit,
      playerAmount,
      iterations,
    })
  }

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
