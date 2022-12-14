import { Card, Deal, Player, PlayerCards, Round } from './round'

export interface HandResult {
  hand: string
  quads: Card[][]
  triples: Card[][]
  pairs: Card[][]
  cards: Card[]
  dealtCards: Card[]
  score: number
}
interface RoundStatistics {
  userSummary: UserSummary[]
  deals?: DealSummary[]
}

interface UserSummary {
  name: string
  handSummary: {
    straightFlushes: number
    quads: number
    fullHouses: number
    flushes: number
    straights: number
    triples: number
    twoPairs: number
    pairs: number
    highCards: number
  }
  qualities: number[]
  worstDeal: HandResult
  bestDeal: HandResult
}

interface DealSummary {
  winningHands: HandResult[]
  winningPlayers: Player[]
  playerCards: PlayerCardsSummary
  tableCards: Card[]
}

interface PlayerCardsSummary extends PlayerCards, HandResult {
  handQuality: number
}
