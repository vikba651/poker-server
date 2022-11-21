import {
  cardStringToArray,
  isFirstWinnerWrapper,
  printCardArray,
  printHandQuality,
  getHandQuality,
} from './poker-logic'
import { generateDealGiven } from './card-generation'
import { ranks, Card } from './constant'

let score: any = {
  win: 1,
  lose: 0,
}

function isHandSame(hand1: Card[], hand2: Card[]) {
  hand1 = hand1.sort(function (a: any, b: any) {
    return ranks.indexOf(a.rank) - ranks.indexOf(b.rank)
  })

  hand2 = hand2.sort(function (a: any, b: any) {
    return ranks.indexOf(a.rank) - ranks.indexOf(b.rank)
  })

  for (let i = 0; i < hand1.length; i++) {
    if (hand1[0].rank !== hand2[0].rank || hand1[0].suit !== hand2[0].suit) {
      return false
    }
    return true
  }
}

function winrate(given: string, nOpponents: number) {
  let deal = generateDealGiven('2C 3C', 5)
  let sortedDeal = deal.sort((a: any, b: any): any => {
    return isFirstWinnerWrapper(a, b)
  })
  // TODO: Checka ifall de blir lika
  if (isHandSame(deal[0], sortedDeal[-1])) {
    return score.win
  }
  return score.lose
}
