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
export interface RoundStatistics {
  userSummaries: UserSummary[]
  deals?: DealSummary[]
}

export interface UserSummary {
  name: string
  handSummary: HandSummary
  qualities: number[]
  worstDeal: HandResult
  bestDeal: HandResult
}

export interface HandSummary {
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

export interface DealSummary {
  winningHands?: HandResult[]
  winningPlayers?: Player[]
  playerCards: PlayerCardsSummary
  tableCards: Card[]
}

export interface PlayerCardsSummary extends PlayerCards, HandResult {
  handQuality?: number
}
