import { Server, Socket } from 'socket.io'
import { Card, Deal, Player, PlayerCards, Round, Session } from '../types/round'
import { playerSockets, sessions } from './lobbyHandlers'
import { RoundModel } from '../models/rounds'
import { PlayerModel } from '../models/players'

export function registerTrackGameHandlers(wss: Server, ws: Socket) {
  const updateTableCards = (data: { cards: Card[]; sessionId: string; deal: number }) => {
    // Add tablecards to session
    const session = sessions.find((session) => session.id === data.sessionId)
    if (session) {
      ws.to(data.sessionId).emit('tableCardsUpdated', data.cards, data.deal)
    } else {
      ws.to(data.sessionId).emit('message', `No session with id=${data.sessionId} found`)
    }
  }

  const endGame = (data: { deals: Card[][]; sessionId: string; currentDeal: number }, callback: any) => {
    const session = sessions.find((session) => session.id === data.sessionId)
    const player = playerSockets.find((player) => player.socket === ws)?.player
    if (player && session) {
      for (let i = 0; i < data.deals.length; i++) {
        if (!data.deals[i].slice(0, 2).every((card) => card.rank && card.suit)) break
        const playerCards: PlayerCards = { name: player.name, cards: data.deals[i].slice(0, 2) }
        if (i >= session.deals.length) {
          const newDeal: Deal = {
            playerCards: [playerCards],
            tableCards: data.deals[i].slice(2),
          }
          session.deals.push(newDeal)
        } else {
          let index = session.deals[i].playerCards.findIndex((playerCards) => playerCards.name === player.name)
          if (index > -1) {
            session.deals[i].playerCards[index] = playerCards
          } else {
            session.deals[i].playerCards.push(playerCards)
          }
          session.deals[i].tableCards = data.deals[i].slice(2)
        }
      }
      const round: Round = {
        _id: session.id,
        deals: session.deals,
        startTime: session.startTime,
      }
      postRound(round, player)
      callback(round)
      ws.to(session.id).emit('playerEndedGame', round)
    } else {
      ws.to(data.sessionId).emit('message', `No session with id=${data.sessionId} found`)
    }
  }

  ws.on('updateTableCards', updateTableCards)
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
