import { Card, Deal, Player, PlayerCards, Round } from './round'

export interface HandResult {
  hand: string
  quads: Card[][]
  triples: Card[][]
  pairs: Card[][]
  bestCards: Card[]
  dealtCards: Card[]
  score: number
}
export interface RoundStatistics {
  userSummaries: UserSummary[]
  deals: DealSummary[]
}

export interface UserSummary {
  name: string
  handSummary: HandSummary
  qualities: number[]
  worstDealIndex: number
  bestDealIndex: number
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
  winningHands: PlayerCardsSummary[]
  playerCards: PlayerCardsSummary[]
  tableCards: Card[]
}

export interface PlayerCardsSummary extends PlayerCards, HandResult {
  winRate: number
  percentile: number
}

export interface PlayerCardQuality {
  winRate: number
  percentile: number
  cardsKey: string
  playerAmount: number
  iterations: number
}

export interface PlayerWinProbabilities {
  name: string
  probabilities: number[]
}
