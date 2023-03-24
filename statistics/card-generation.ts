import { suits, ranks } from './constant'
import { Card, PlayerCards } from '../types/round'
import { getHandResult } from './poker-logic'

export function cardStringToArray(handString: string) {
  let cardArray = handString.split(' ').map((card) => {
    return {
      rank: card.slice(0, -1),
      suit: card.slice(-1),
    }
  })
  return cardArray
}

export function pickFromDeck(array: Card[], n: number) {
  // Modifies array inplace
  let samples = []
  for (let i = 0; i < n; i++) {
    let index = Math.floor(Math.random() * array.length)
    samples.push(array[index])
    array.splice(index, 1)
  }
  return samples
}

export function includesCard(sourceCards: Card[], targetCard: Card): boolean {
  for (let card of sourceCards) {
    if (card.suit === targetCard.suit && card.rank === targetCard.rank) {
      return true
    }
  }
  return false
}

export function getDeck(): Card[] {
  const deck: Card[] = []
  ranks.forEach((rank) => {
    suits.forEach((suit) => {
      deck.push({
        rank,
        suit,
      })
    })
  })
  return deck
}

export function generateDeal1Player(playerCards: Card[], playerAmount: number) {
  if (playerAmount > 20) {
    throw 'You cant have more than 20 players!'
  }
  let deck = getDeck()
  // playerCards = cardStringToArray(playerCards)

  deck = deck.filter((card) => {
    return !includesCard(playerCards, card)
  })
  let tableCards = pickFromDeck(deck, 5)

  let generatedHands = [playerCards.concat(tableCards)]

  for (let i = 0; i < playerAmount - 1; i++) {
    let opponentCards = pickFromDeck(deck, 2)
    generatedHands.push(opponentCards.concat(tableCards))
  }
  return generatedHands
}
