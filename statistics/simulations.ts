import { getHandResult } from './poker-logic'
import { cardStringToArray, generateDeal1Player, getDeck, includesCard, pickFromDeck } from './card-generation'
import { cardArrayToString, handQualityToString } from './to-strings'
import { Card, Deal, Player, PlayerCards, Round, Session } from '../types/round'
import { DealSummary, PlayerCardQuality, PlayerWinProbabilities } from '../types/statistics'
import { PlayerCardQualityModel } from '../models/statistics'
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

  PlayerCardQualityModel.insertMany(playerCardQualities)
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
    let deal = generateDeal1Player(playerCards, playerAmount)
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

export function getDealWinProbabilities(deal: Deal | DealSummary): PlayerWinProbabilities[] {
  const preFlopWinProbability = getPreFlopWinProbability(deal.playerCards, 2500)
  let flopWinProbability: PhaseWinProbability[]
  if (deal.tableCards.length >= 3) {
    flopWinProbability = getFlopWinProbability(deal.playerCards, deal.tableCards.slice(0, 3))
  }
  let turnWinProbability: PhaseWinProbability[]
  if (deal.tableCards.length >= 4) {
    turnWinProbability = getTurnWinProbability(deal.playerCards, deal.tableCards.slice(0, 4))
  }
  let riverWinProbability: PhaseWinProbability[]
  if (deal.tableCards.length == 5) {
    riverWinProbability = getRiverWinProbability(deal.playerCards, deal.tableCards)
  }
  const dealWinProbabilities = deal.playerCards.map((playerCards) => {
    const playerWinProbabilities: PlayerWinProbabilities = {
      name: playerCards.name,
      probabilities: [findProbability(preFlopWinProbability, playerCards.name)],
    }
    if (flopWinProbability) {
      playerWinProbabilities.probabilities.push(findProbability(flopWinProbability, playerCards.name))
    }
    if (turnWinProbability) {
      playerWinProbabilities.probabilities.push(findProbability(turnWinProbability, playerCards.name))
    }
    if (riverWinProbability) {
      playerWinProbabilities.probabilities.push(findProbability(riverWinProbability, playerCards.name))
    }
    return playerWinProbabilities
  })
  return dealWinProbabilities
}

function findProbability(phaseWinProbabilities: PhaseWinProbability[], name: string): number {
  const found = phaseWinProbabilities.find((e) => e.name == name)
  if (found) {
    return found.probability
  }
  return 0
}

interface Simulation {
  playerScores: {
    score: number
    name: string
  }[]
  maxScore: number
}

interface PhaseWinProbability {
  name: string
  probability: number
}

export function getPreFlopWinProbability(allPlayerCards: PlayerCards[], iterations: number): PhaseWinProbability[] {
  if (allPlayerCards.length > 20) {
    throw 'You cant have more than 20 players!'
  }

  let unavailableCards: Card[] = []
  allPlayerCards.forEach((playerCards) => {
    playerCards.cards.forEach((card) => {
      unavailableCards.push(card)
    })
  })

  const simulations: Simulation[] = []

  for (let i = 0; i < iterations; i++) {
    let deck = getDeck()
    deck = deck.filter((card: any) => {
      return !includesCard(unavailableCards, card)
    })
    const tableCards = pickFromDeck(deck, 5)
    simulations.push(getSimulation(allPlayerCards, tableCards))
  }
  return simulationWinnersToPhaseWinProbabilities(simulations, allPlayerCards)
}

export function getFlopWinProbability(allPlayerCards: PlayerCards[], tableCards: Card[]): PhaseWinProbability[] {
  if (allPlayerCards.length > 20) {
    throw 'You cant have more than 20 players!'
  }
  if (tableCards.length != 3) {
    throw 'Flop must be sent in with 3 table cards'
  }

  let unavailableCards: Card[] = []
  allPlayerCards.forEach((playerCards) => {
    playerCards.cards.forEach((card) => {
      unavailableCards.push(card)
    })
  })
  tableCards.forEach((card) => {
    unavailableCards.push(card)
  })

  const simulations: Simulation[] = []

  let deck = getDeck()
  deck = deck.filter((card: any) => {
    return !includesCard(unavailableCards, card)
  })
  //Stop when there is no combinations of two cards left
  while (deck.length > 1) {
    //Pop so each combination of two cards is only checked once
    const firstCard = deck.pop()
    if (!firstCard) {
      // TypeScript thinks this might be undefined
      break
    }
    deck.forEach((secondCard) => {
      const newTableCards = tableCards.concat([{ ...firstCard }, { ...secondCard }])
      simulations.push(getSimulation(allPlayerCards, newTableCards))
    })
  }
  return simulationWinnersToPhaseWinProbabilities(simulations, allPlayerCards)
}

export function getTurnWinProbability(allPlayerCards: PlayerCards[], tableCards: Card[]): PhaseWinProbability[] {
  if (allPlayerCards.length > 20) {
    throw 'You cant have more than 20 players!'
  }
  if (tableCards.length != 4) {
    throw 'Turn must be sent in with 4 table cards'
  }

  let unavailableCards: Card[] = []
  allPlayerCards.forEach((playerCards) => {
    playerCards.cards.forEach((card) => {
      unavailableCards.push(card)
    })
  })
  tableCards.forEach((card) => {
    unavailableCards.push(card)
  })

  const simulations: Simulation[] = []

  let deck = getDeck()
  deck = deck.filter((card: any) => {
    return !includesCard(unavailableCards, card)
  })
  deck.forEach((card) => {
    const newTableCards = tableCards.concat([{ ...card }])
    simulations.push(getSimulation(allPlayerCards, newTableCards))
  })

  return simulationWinnersToPhaseWinProbabilities(simulations, allPlayerCards)
}

export function getRiverWinProbability(allPlayerCards: PlayerCards[], tableCards: Card[]): PhaseWinProbability[] {
  if (allPlayerCards.length > 20) {
    throw 'You cant have more than 20 players!'
  }
  if (tableCards.length != 5) {
    throw 'River must be sent in with 5 table cards'
  }

  const simulations = [getSimulation(allPlayerCards, tableCards)]
  return simulationWinnersToPhaseWinProbabilities(simulations, allPlayerCards)
}

function getSimulation(allPlayerCards: PlayerCards[], tableCards: Card[]): Simulation {
  const generatedScores = allPlayerCards.map((playerCards) => {
    return {
      score: getHandResult(playerCards.cards.concat(tableCards)).score,
      name: playerCards.name,
    }
  })
  const simulation = {
    playerScores: [...generatedScores],
    maxScore: getMaxScore(generatedScores),
  }
  return simulation
}

function simulationWinnersToPhaseWinProbabilities(
  simulations: Simulation[],
  allPlayerCards: PlayerCards[]
): PhaseWinProbability[] {
  const simulationsWinnersArray = simulations.map((simulation) => {
    const amountOfWinners = simulation.playerScores.reduce((currentAmountOfWinners, playerScore) => {
      if (playerScore.score == simulation.maxScore) {
        return currentAmountOfWinners + 1
      }
      return currentAmountOfWinners
    }, 0)

    const playerWins = simulation.playerScores.map((playerScore) => {
      //A tie is a win divided how many winners eg. a three-way win counts as 0.33 wins
      if (playerScore.score == simulation.maxScore) {
        return { win: 1 / amountOfWinners, name: playerScore.name }
      }
      return { win: 0, name: playerScore.name }
    })

    return playerWins
  })

  const initialWinnersCount = allPlayerCards.map((playerCards) => {
    return { name: playerCards.name, wins: 0 }
  })

  const phaseTotalWins = simulationsWinnersArray.reduce((currentWinnersCount, simulationWinners) => {
    return currentWinnersCount.map((currentWinnerCount) => {
      let win = 0
      if (simulationWinners) {
        const tempWin = simulationWinners.find((simulationWinner) => {
          return simulationWinner.name == currentWinnerCount.name
        })?.win
        if (tempWin) win = win + tempWin
      }
      return {
        name: currentWinnerCount.name,
        wins: currentWinnerCount.wins + win,
      }
    })
  }, initialWinnersCount)

  const phaseWinProbabilities: PhaseWinProbability[] = phaseTotalWins.map((phaseTotalWinsPerUser) => {
    return { name: phaseTotalWinsPerUser.name, probability: phaseTotalWinsPerUser.wins / simulations.length }
  })

  return phaseWinProbabilities
}

function getMaxScore(
  generatedScores: {
    score: number
    name: string
  }[]
) {
  return generatedScores.reduce((currentMaxScore, generatedScore) => {
    if (generatedScore.score > currentMaxScore) {
      return generatedScore.score
    }
    return currentMaxScore
  }, 0)
}
