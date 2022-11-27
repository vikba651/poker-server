import { suits, ranks } from './constant'

export function cardStringToArray(handString: string) {
  let cardArray = handString.split(' ').map((card) => {
    return {
      rank: card.charAt(0),
      suit: card.charAt(1),
    }
  })
  return cardArray
}

function sampleArray(array: any, n: any) {
  // Modifies array inplace
  let samples = []
  for (let i = 0; i < n; i++) {
    let index = Math.floor(Math.random() * array.length)
    samples.push(array[index])
    array.splice(index, 1)
  }
  return samples
}

function customIncludes(sourceCards: any, targetCard: any) {
  for (let card of sourceCards) {
    if (card.suit === targetCard.suit && card.rank === targetCard.rank) {
      return true
    }
  }
  return false
}

export function generateDealGiven(playerCards: any, playerAmount: any) {
  if (playerAmount > 20) {
    throw 'You cant have more than 20 players!'
  }
  let deck: any = []
  ranks.forEach((rank) => {
    suits.forEach((suit) => {
      deck.push({
        rank,
        suit,
      })
    })
  })
  // playerCards = cardStringToArray(playerCards)

  deck = deck.filter((card: any) => {
    return !customIncludes(playerCards, card)
  })
  let tableCards = sampleArray(deck, 5)

  let generated_hands = [playerCards.concat(tableCards)]

  for (let i = 0; i < playerAmount - 1; i++) {
    let opponentCards = sampleArray(deck, 2)
    generated_hands.push(opponentCards.concat(tableCards))
  }
  return generated_hands
}
