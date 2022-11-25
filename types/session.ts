import { Socket } from 'socket.io'

export interface Session {
  id: string
  code: string
  creator: string
  players: Player[]
  deals: Deal[]
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
  id: number
  playerCards: PlayerCards[]
  tableCards: Card[]
}

export interface PlayerCards {
  name: string
  cards: Card[]
}

export interface Card {
  suit: string
  value: string
}
