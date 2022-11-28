import { Server, Socket } from 'socket.io'
import { Player, PlayerSocket, Session } from '../types/session'
import { v4 as uuidv4 } from 'uuid'

export let sessions: Session[] = []
export let playerSockets: PlayerSocket[] = []

export function registerLobbyHandlers(wss: Server, ws: Socket) {
  const createSession = (data: { name: string; location: any }) => {
    const player: Player = {
      id: uuidv4(),
      name: data.name,
    }
    playerSockets.push({
      socket: ws,
      player: player,
    })
    const firstDeal = {
      id: 1,
      playerCards: [],
      tableCards: [],
    }

    const session: Session = {
      id: uuidv4(),
      code: createCode(),
      creator: data.name,
      players: [player],
      deals: [firstDeal],
      startTime: Date.now(),
    }
    sessions.push(session)
    ws.join(session.id)
    ws.emit('sessionCreated', session)
    ws.broadcast.emit('sendLocation', data.location, session.code)
  }

  const joinSession = (data: { code: string; name: string }) => {
    let session = sessions.find((session) => session.code === data.code)
    if (session) {
      const player: Player = {
        id: uuidv4(),
        name: data.name,
      }
      playerSockets.push({
        socket: ws,
        player: player,
      })
      session.players.push(player)
      ws.join(session.id)
      wss.in(session.id).emit('sessionUpdated', session)
    } else {
      ws.send('Invalid session code')
    }
  }

  const startTracking = (data: { sessionId: string }) => {
    const sessionId = data.sessionId
    ws.to(sessionId).emit('trackingStarted')
  }

  ws.on('createSession', createSession)
  ws.on('joinSession', joinSession)
  ws.on('startTracking', startTracking)
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function createCode(): string {
  let res = ''
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * ALPHABET.length)
    res = res.concat(ALPHABET[randomIndex])
  }
  return res
}
