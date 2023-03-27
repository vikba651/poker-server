import { getHandResult } from '../statistics/poker-logic'

let handResult = getHandResult([
  {
    suit: 'heart',
    rank: '2',
  },
  {
    suit: 'spade',
    rank: '2',
  },
  {
    suit: 'spade',
    rank: '3',
  },
  {
    suit: 'diamond',
    rank: '3',
  },
  {
    suit: 'heart',
    rank: '3',
  },
  {
    suit: 'heart',
    rank: '4',
  },
  {
    suit: 'diamond',
    rank: '4',
  },
])

handResult = getHandResult([
  {
    suit: 'H',
    rank: '2',
  },
  {
    suit: 'S',
    rank: '2',
  },
  {
    suit: 'S',
    rank: '3',
  },
  {
    suit: 'D',
    rank: '3',
  },
  {
    suit: 'H',
    rank: '3',
  },
  {
    suit: 'H',
    rank: '4',
  },
  {
    suit: 'D',
    rank: '4',
  },
])

console.log(handResult)

// const playerCardQualities = simulateAllPlayerCards(4, 100)

// playerCardQualities.forEach((playerCardQuality) => {
//   console.log(playerCardQuality.cardsKey, playerCardQuality.percentile, playerCardQuality.winRate)
// })
