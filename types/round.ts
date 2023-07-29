import { Socket } from 'socket.io'

export interface Round {
  _id: string
  deals: Deal[]
  earnings: PlayerEarning[]
  startTime: number
  emoji: string
}
export interface Session {
  id: string
  code: string
  creator: string
  players: Player[]
  deals: Deal[]
  startTime: number
  startTracking: boolean
}

export interface Player {
  id: string
  name: string
}

export interface PlayerSocket {
  socket: Socket<any>
  player: Player
}

export interface Deal {
  playerCards: PlayerCards[]
  tableCards: Card[]
}

export interface PlayerCards {
  name: string
  cards: Card[]
}

export interface Card {
  suit: string
  rank: string
}

export interface PlayerEarning {
  name: string
  earning: number
}
