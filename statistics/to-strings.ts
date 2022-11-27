import { suitEmoji, suits, Card, HandQuality } from './constant'

export function cardArrayToString(cardArray: Card[]) {
  cardArray.forEach((card) => {
    process.stdout.write(`${card.rank}${suitEmoji[suits.indexOf(card.suit)]} `)
  })
  console.log(' ')
}

export function handQualityToString(handQuality: HandQuality) {
  console.log(handQuality.hand)
  console.log(handQuality.score)
  process.stdout.write(`Best Cards: `)
  cardArrayToString(handQuality.cards)
  process.stdout.write(`Dealt Cards: `)
  cardArrayToString(handQuality.dealtCards)
  function printSets(cards: Card[]) {
    cards.forEach((card) => {
      process.stdout.write(`${card.rank}${suitEmoji[suits.indexOf(card.suit)]} `)
    })
    process.stdout.write(`  `)
  }
  if (handQuality.pairs.length) {
    process.stdout.write(`Pairs: `)
    handQuality.pairs.forEach(printSets)
    console.log(' ')
  }
  if (handQuality.triples.length) {
    process.stdout.write(`Triples: `)
    handQuality.triples.forEach(printSets)
    console.log(' ')
  }
  if (handQuality.quads.length) {
    process.stdout.write(`Quads: `)
    handQuality.quads.forEach(printSets)
    console.log(' ')
  }
}
