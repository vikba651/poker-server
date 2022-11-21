import { suitEmoji, suits, ranks, hands, results, Card } from './constant'

export function printCardArray(cardArray: Card[]) {
  cardArray.forEach((card) => {
    process.stdout.write(`${card.rank}${suitEmoji[suits.indexOf(card.suit)]} `)
  })
  console.log(' ')
}

export function printHandQuality(handQuality: any) {
  console.log(hands[handQuality.handType])
  if (handQuality.highCards) {
    printCardArray(handQuality.highCards)
  }
  if (handQuality.comp) {
    console.log(handQuality.comp)
  }
}

export function cardStringToArray(handString: string) {
  let cardArray = handString.split(' ').map((card) => {
    return {
      rank: card.charAt(0),
      suit: card.charAt(1),
    }
  })
  return cardArray
}

interface Groups {
  [key: string]: Card[]
}

function groupBy(objectArray: Card[], property: string): Groups {
  return objectArray.reduce(function (acc: any, obj: any) {
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
  flushHand = flushHand.sort(function (a: any, b: any) {
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

function filterCardArrayRank(cardArray: Card[], removeRanks: string[]) {
  cardArray = cardArray.sort((a, b) => ranks.indexOf(a.rank) - ranks.indexOf(b.rank))
  return cardArray.filter((card) => !removeRanks.includes(card.rank))
}

export function getHandQuality(cardArray: Card[]) {
  const rankGroups = groupBy(cardArray, 'rank')
  let quads: string[] = []
  let trips: string[] = []
  let pairs: string[] = []
  for (const rank in rankGroups) {
    if (rankGroups[rank].length === 4) {
      quads.push(rank)
    }
    if (rankGroups[rank].length === 3) {
      trips.push(rank)
      trips.sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b))
    }
    if (rankGroups[rank].length === 2) {
      pairs.push(rank)
      pairs.sort((a, b) => ranks.indexOf(a) - ranks.indexOf(b))
    }
  }
  if (straight(flush(cardArray, true)).length) {
    return {
      handType: hands.indexOf('Straight flush'),
      comp: undefined,
      highCards: straight(flush(cardArray, false)),
      originalHand: cardArray,
    }
  } else if (quads.length) {
    return {
      handType: hands.indexOf('Four of a kind'),
      comp: { quad: quads.pop() },
      highCards: filterCardArrayRank(cardArray, trips.slice(-1)).slice(-1),
      originalHand: cardArray,
    }
  } else if (trips.length & pairs.length) {
    return {
      handType: hands.indexOf('Full house'),
      comp: { trip: trips.pop(), pair: pairs.pop() },
      highCards: undefined,
      originalHand: cardArray,
    }
  } else if (flush(cardArray, false).length) {
    return {
      handType: hands.indexOf('Flush'),
      comp: undefined,
      highCards: flush(cardArray, false),
      originalHand: cardArray,
    }
  } else if (straight(cardArray).length) {
    return {
      handType: hands.indexOf('Straight'),
      comp: undefined,
      highCards: straight(cardArray),
      originalHand: cardArray,
    }
  } else if (trips.length) {
    return {
      handType: hands.indexOf('Three of a kind'),
      comp: {
        trip: trips[0],
      },
      highCards: filterCardArrayRank(cardArray, trips.slice(-1)).slice(-2),
      originalHand: cardArray,
    }
  } else if (pairs.length >= 2) {
    return {
      handType: hands.indexOf('Two pairs'),
      comp: {
        pairs: pairs.slice(-2),
      },
      highCards: filterCardArrayRank(cardArray, pairs.slice(-2)).slice(-1),
      originalHand: cardArray,
    }
  } else if (pairs.length) {
    return {
      handType: hands.indexOf('Pair'),
      comp: {
        pair: pairs[0],
      },
      highCards: filterCardArrayRank(cardArray, pairs).slice(-3),
      originalHand: cardArray,
    }
  } else {
    return {
      handType: hands.indexOf('High card'),
      comp: undefined,
      highCards: cardArray.slice(-5),
      originalHand: cardArray,
    }
  }
}

export function isFirstWinnerWrapper(cardArray1: Card[], cardArray2: Card[]) {
  let res = isFirstWinner(cardArray1, cardArray2)
  printHandQuality(getHandQuality(cardArray1))
  if (res === results.lose) {
    console.log('loses vs')
  }
  if (res === results.win) {
    console.log('Wins vs')
  }
  if (res === results.tie) {
    console.log('ties vs')
  }
  printHandQuality(getHandQuality(cardArray2))
  console.log('----- --------')
  return res
}

export function isFirstWinner(cardArray1: Card[], cardArray2: Card[]) {
  let handQuality1 = getHandQuality(cardArray1)
  let handQuality2 = getHandQuality(cardArray2)

  function highestCard(subCardArray1: any, subCardArray2: any) {
    let length = Math.min(subCardArray1.length, subCardArray2.length)
    for (let i = length - 1; i >= 0; i--) {
      if (ranks.indexOf(subCardArray1[i].rank) > ranks.indexOf(subCardArray2[i].rank)) {
        return results.win
      } else if (ranks.indexOf(subCardArray1[i].rank) < ranks.indexOf(subCardArray2[i].rank)) {
        return results.lose
      }
    }
    return results.tie
  }

  function highestSetCard(setObject1: any, setObject2: any, setType: any) {
    if (ranks.indexOf(setObject1[setType]) > ranks.indexOf(setObject2[setType])) {
      return results.win
    } else if (ranks.indexOf(setObject1[setType]) < ranks.indexOf(setObject2[setType])) {
      return results.lose
    }
    return results.tie
  }

  function highestTwoPair(pairArray1: any, pairArray2: any) {
    while (pairArray1.pairs.length) {
      // Do this two times
      if (ranks.indexOf(pairArray1.pairs[-1]) > ranks.indexOf(pairArray2.pairs[-1])) {
        pairArray1.pairs.pop()
        pairArray2.pairs.pop()
        return results.win
      } else if (ranks.indexOf(pairArray1.pairs.pop()) < ranks.indexOf(pairArray2.pairs.pop())) {
        return results.lose
      }
    }
    return results.tie
  }

  if (handQuality1.handType === handQuality2.handType) {
    let outcome = results.tie
    if (hands[handQuality1.handType] === 'Straight flush') {
      return highestCard(handQuality1.highCards, handQuality2.highCards)
    } else if (hands[handQuality1.handType] === 'Four of a kind') {
      outcome = highestSetCard(handQuality1.comp, handQuality2.comp, 'quad')
      if (outcome === results.tie) {
        return highestCard(handQuality1.highCards, handQuality2.highCards)
      }
    } else if (hands[handQuality1.handType] === 'Full house') {
      outcome = highestSetCard(handQuality1.comp, handQuality2.comp, 'trip')
      if (outcome === results.tie) {
        return highestSetCard(handQuality1.comp, handQuality2.comp, 'pair')
      }
    } else if (hands[handQuality1.handType] === 'Flush') {
      return highestCard(handQuality1.highCards, handQuality2.highCards)
    } else if (hands[handQuality1.handType] === 'Straight') {
      return highestCard(handQuality1.highCards, handQuality2.highCards)
    } else if (hands[handQuality1.handType] === 'Three of a kind') {
      outcome = highestSetCard(handQuality1.comp, handQuality2.comp, 'trip')
      if (outcome === results.tie) {
        return highestCard(handQuality1.highCards, handQuality2.highCards)
      }
    } else if (hands[handQuality1.handType] === 'Two pairs') {
      outcome = highestTwoPair(handQuality1.comp, handQuality2.comp)
      if (outcome === results.tie) {
        return highestCard(handQuality1.highCards, handQuality2.highCards)
      }
    } else if (hands[handQuality1.handType] === 'Pair') {
      outcome = highestSetCard(handQuality1.comp, handQuality2.comp, 'pair')
      if (outcome === results.tie) {
        return highestCard(handQuality1.highCards, handQuality2.highCards)
      }
    } else if (hands[handQuality1.handType] === 'High card') {
      return highestCard(handQuality1.highCards, handQuality2.highCards)
    }
    return outcome
  }

  for (let i = 0; i < hands.length; i++) {
    if (handQuality1.handType === i) {
      return results.win
    }
    if (handQuality2.handType === i) {
      return results.lose
    }
  }

  return results.tie
}
