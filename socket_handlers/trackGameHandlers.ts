import { Server, Socket } from 'socket.io'
import { Card, Deal, PlayerCards } from '../types/session'
import { playerSockets, sessions } from './lobbyHandlers'
import { inspect } from 'util'

export function registerTrackGameHandlers(wss: Server, ws: Socket) {
  const onNewDeal = (data: { sessionId: string; cards: Card[]; deal: number }) => {
    const player = playerSockets.find((player) => player.socket === ws)?.player
    const session = sessions.find((session) => session.id === data.sessionId)
    if (player && session) {
      const playerCards: PlayerCards = {
        name: player.name,
        cards: data.cards.slice(0, 2),
      }

      let currentDeal = session.deals.find((deal) => deal.id === data.deal)
      if (currentDeal) {
        currentDeal.playerCards.push(playerCards)
      } else {
        console.error(`Deal ${data.deal} does not exist?`)
      }
      const nextDeal = session.deals.find((deal) => deal.id === data.deal + 1)
      if (nextDeal) {
        ws.emit('tableCardsUpdated', nextDeal.tableCards, data.deal + 1)
      } else {
        const newDeal: Deal = {
          id: data.deal + 1,
          playerCards: [],
          tableCards: [],
        }
        session.deals.push(newDeal)
      }
    }
  }

  const updateTableCards = (data: { cards: Card[]; sessionId: string; deal: number }) => {
    // Add to tablecards to session
    const session = sessions.find((session) => session.id === data.sessionId)
    if (session) {
      let currentDeal = session.deals.find((deal) => deal.id === data.deal)
      if (currentDeal) {
        currentDeal.tableCards = data.cards
      } else {
        console.error(`Deal ${data.deal} has not been created`)
      }
      ws.to(data.sessionId).emit('tableCardsUpdated', data.cards, data.deal)
    } else {
      ws.to(data.sessionId).emit('message', `No session with id=${data.sessionId} found`)
    }
  }

  ws.on('updateTableCards', updateTableCards)
  ws.on('onNewDeal', onNewDeal)
}
