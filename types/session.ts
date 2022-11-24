interface Session {
  id: string
  code: string
  creator: string
  players: string[]
  deals?: Deal[]
}

interface Deal {
  playerCards: PlayerCards[]
  tableCards: Card[]
}

interface PlayerCards {
  name: string
  cards: Card[]
}

interface Card {
  suit: Suit
  value: string
}

enum Suit {
  HEART,
  CLUB,
  DIAMOND,
  SPADE,
}
