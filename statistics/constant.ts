export const suitEmoji = ['♧', '♦', '♥', '♤']
export const suits = ['C', 'D', 'H', 'S']
export const ranks: string[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
export const hands = [
  'Straight flush',
  'Four of a kind',
  'Full house',
  'Flush',
  'Straight',
  'Three of a kind',
  'Two pairs',
  'Pair',
  'High card',
]
export const results = {
  win: 1,
  tie: 0,
  lose: -1,
}

export interface Card {
  suit: string
  rank: string
}
