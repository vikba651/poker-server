import { Server, Socket } from 'socket.io'
import { Card, Deal, Player, PlayerCards, Round, Session } from '../types/round'
import { playerSockets, sessions } from './lobbyHandlers'
import { RoundModel } from '../models/rounds'
import { PlayerModel } from '../models/players'

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

  const endGame = (data: { cards: Card[]; sessionId: string; currentDeal: number }, callback: any) => {
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
      const round: Round = {
        _id: session.id,
        deals: session.deals,
        startTime: session.startTime,
      }
      postRound(round, player)
      callback(round)
    } else {
      ws.to(data.sessionId).emit('message', `No session with id=${data.sessionId} found`)
    }
  }

  ws.on('updateTableCards', updateTableCards)
  ws.on('newDeal', newDeal)
  ws.on('endGame', endGame)
}

const postRound = async (round: Round, player: Player) => {
  try {
    const roundExists = await RoundModel.findByIdAndUpdate(round._id, {
      deals: round.deals,
    })
    if (roundExists) {
      console.log('Updated round successfully')
    } else {
      let roundModel = new RoundModel(round)
      await roundModel.save()
      console.log('Posted round successfully')
    }
    await PlayerModel.findOneAndUpdate(
      { name: player.name },
      {
        $push: { roundIds: round._id },
      }
    )
  } catch (e: any) {
    console.log('Could not post newRound', e)
  }
}
