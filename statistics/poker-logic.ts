import { Card } from '../types/round'
import { HandResult } from '../types/statistics'
import { ranks, hands } from './constant'

interface Groups {
  [key: string]: Card[]
}

function groupBy(objectArray: Card[], property: 'rank' | 'suit'): Groups {
  return objectArray.reduce(function (acc: Groups, obj: Card) {
    var key = obj[property]
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(obj)
    return acc
  }, {})
}

function flush(cardArray: Card[], five_cards: boolean) {
  const suitGroups = groupBy(cardArray, 'suit')
  let flushHand: Card[] = []
  for (const suit in suitGroups) {
    if (suitGroups[suit].length >= 5) {
      flushHand = suitGroups[suit]
    }
  }
  flushHand = flushHand.sort(function (a: Card, b: Card) {
    return ranks.indexOf(a.rank) - ranks.indexOf(b.rank)
  })
  if (five_cards) {
    if (flushHand.length >= 5) {
      flushHand = flushHand.slice(-5)
    }
  }
  return flushHand
}

function straight(cardArray: Card[]) {
  cardArray = cardArray.sort((a, b) => ranks.indexOf(a.rank) - ranks.indexOf(b.rank))
  let uniqueCardArray: Card[] = []
  ;['A'].concat(ranks).forEach((rank: string) => {
    const foundCard = cardArray.find((card) => card.rank === rank)
    if (foundCard) {
      uniqueCardArray.push(foundCard)
    }
  })

  let straightHand: Card[] = []

  if (uniqueCardArray.length < 5) {
    return straightHand
  }
  const rankString = 'A' + ranks.map((rank) => rank).join('')

  for (let i = 0; i <= uniqueCardArray.length - 5; i++) {
    let cardString = uniqueCardArray
      .slice(i, i + 5)
      .map((card) => card.rank)
      .join('')
    if (rankString.includes(cardString)) {
      straightHand = uniqueCardArray.slice(i, i + 5)
    }
  }
  return straightHand
}

function filterSets(cardArray: Card[], sets: Card[][]): Card[] {
  let newCardArray = cardArray.filter((card) => {
    for (let i = 0; i < sets.length; i++) {
      let set = sets[i]
      if (card.rank == set[0].rank) {
        return false
      }
    }
    return true
  })
  return newCardArray
}

export function getHandResult(cardArray: Card[]): HandResult {
  const rankGroups = groupBy(cardArray, 'rank')
  let handQuality: HandResult = {
    hand: '',
    quads: [],
    triples: [],
    pairs: [],
    cards: [],
    dealtCards: cardArray,
    score: 0,
  }

  for (const rank in rankGroups) {
    if (rankGroups[rank].length === 4) {
      handQuality.quads.push(rankGroups[rank])
    }
    if (rankGroups[rank].length === 3) {
      handQuality.triples.push(rankGroups[rank])
      handQuality.triples.sort((a, b) => ranks.indexOf(a[0].rank) - ranks.indexOf(b[0].rank))
    }
    if (rankGroups[rank].length === 2) {
      handQuality.pairs.push(rankGroups[rank])
      handQuality.pairs.sort((a, b) => ranks.indexOf(a[0].rank) - ranks.indexOf(b[0].rank))
    }
  }

  function getScore(cardArray: Card[], hand: string): number {
    let base = 1
    let score = 0
    cardArray.forEach((card) => {
      score += ranks.indexOf(card.rank) * base
      base *= 100
    })

    score += (hands.length - hands.indexOf(hand)) * base
    return score
  }

  cardArray = cardArray.sort((a, b) => ranks.indexOf(a.rank) - ranks.indexOf(b.rank))
  if (straight(flush(cardArray, true)).length) {
    handQuality.hand = 'Straight flush'
    cardArray = straight(flush(cardArray, true))
  } else if (handQuality.quads.length) {
    handQuality.hand = 'Four of a kind'
    cardArray = [...filterSets(cardArray, handQuality.quads).slice(-1), ...handQuality.quads.slice(-1)[0]]
  } else if (handQuality.triples.length & handQuality.pairs.length) {
    handQuality.hand = 'Full house'
    cardArray = [...handQuality.pairs.slice(-1)[0], ...handQuality.triples.slice(-1)[0]]
  } else if (flush(cardArray, false).length) {
    handQuality.hand = 'Flush'
    cardArray = flush(cardArray, false)
  } else if (straight(cardArray).length) {
    handQuality.hand = 'Straight'
    cardArray = straight(cardArray)
  } else if (handQuality.triples.length) {
    handQuality.hand = 'Three of a kind'
    cardArray = [...filterSets(cardArray, handQuality.triples).slice(-2), ...handQuality.triples[0]]
  } else if (handQuality.pairs.length >= 2) {
    handQuality.hand = 'Two pairs'
    cardArray = [
      ...filterSets(cardArray, handQuality.pairs).slice(-1),
      ...handQuality.pairs.slice(-2)[0],
      ...handQuality.pairs.slice(-1)[0],
    ]
  } else if (handQuality.pairs.length) {
    handQuality.hand = 'Pair'
    cardArray = [...filterSets(cardArray, handQuality.pairs).slice(-3), ...handQuality.pairs[0]]
  } else {
    handQuality.hand = 'High card'
  }

  handQuality.cards = cardArray.slice(-5)
  handQuality.score = getScore(handQuality.cards, handQuality.hand)

  return handQuality
}
