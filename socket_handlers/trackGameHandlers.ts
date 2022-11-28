import { Server, Socket } from 'socket.io'
import { Card, Deal, Player, PlayerCards, Session } from '../types/session'
import { playerSockets, sessions } from './lobbyHandlers'
import { RoundModel } from '../models/rounds'

export function registerTrackGameHandlers(wss: Server, ws: Socket) {
  const newDeal = (data: { sessionId: string; cards: Card[]; deal: number }) => {
    const player = playerSockets.find((player) => player.socket === ws)?.player
    const session = sessions.find((session) => session.id === data.sessionId)
    if (player && session) {
      const playerCards: PlayerCards = {
        name: player.name,
        cards: data.cards,
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
    // Add tablecards to session
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

  const endGame = (data: { cards: Card[]; sessionId: string; currentDeal: number }) => {
    // Add tablecards to session
    const session = sessions.find((session) => session.id === data.sessionId)
    const player = playerSockets.find((player) => player.socket === ws)?.player
    if (player && session) {
      let currentDeal = session.deals.find((deal) => deal.id === data.currentDeal)
      if (data.cards && currentDeal) {
        const playerCards: PlayerCards = {
          name: player.name,
          cards: data.cards,
        }
        currentDeal.playerCards.push(playerCards)
      } else {
        console.error(`Deal ${data.currentDeal} has not been created`)
      }
      postRound(session, player)
    } else {
      ws.to(data.sessionId).emit('message', `No session with id=${data.sessionId} found`)
    }
  }

  ws.on('updateTableCards', updateTableCards)
  ws.on('newDeal', newDeal)
  ws.on('endGame', endGame)
}

export const postRound = async (session: Session, player?: Player) => {
  try {
    const roundExists = await RoundModel.findByIdAndUpdate(session.id, {
      deals: session.deals,
    })
    if (roundExists) {
      console.log('Updated round successfully')
    } else {
      let round = new RoundModel({
        _id: session.id,
        deals: session.deals,
        startTime: session.startTime,
      })
      try {
        await round.save()
        console.log('Posted round successfully')
      } catch (e: any) {
        console.log('Could not post newRound', round)
      }
    }
  } catch (e: any) {
    return console.error(e)
  }
}
