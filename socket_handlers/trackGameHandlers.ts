import { Server, Socket } from 'socket.io'

export function registerTrackGameHandlers(wss: Server, ws: Socket) {
  const onNewDeal = (data: { sessionId: string }) => {
    ws.to(data.sessionId).emit('newDeal')
  }

  const updateTableCards = (data: { cards: any; sessionId: string }) => {
    ws.to(data.sessionId).emit('tableCardsUpdated', data.cards)
  }

  ws.on('updateTableCards', updateTableCards)
  ws.on('onNewDeal', onNewDeal)
}
