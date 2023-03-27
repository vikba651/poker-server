import { Server, Socket } from 'socket.io'
import { Player, PlayerSocket, Session } from '../types/round'
import { v4 as uuidv4 } from 'uuid'

export let sessions: Session[] = []
export let playerSockets: PlayerSocket[] = []

export function registerLobbyHandlers(wss: Server, ws: Socket) {
  const createSession = (data: { name: string; location: any }, callback: any) => {
    const player: Player = {
      id: uuidv4(),
      name: data.name,
    }
    addPlayerSocket(ws, player)

    const session: Session = {
      id: uuidv4(),
      code: createCode(),
      creator: data.name,
      players: [player],
      deals: [],
      startTime: Date.now(),
      startTracking: false,
    }
    sessions.push(session)
    ws.join(session.id)
    if (typeof callback == 'function') {
      callback(session)
    }
    ws.broadcast.emit('sendLocation', data.location, session.code)
  }

  const joinSession = (data: { code: string; name: string }, callback: any) => {
    let session = sessions.find((session) => session.code === data.code)
    if (session) {
      const player: Player = {
        id: uuidv4(),
        name: data.name,
      }
      addPlayerSocket(ws, player)
      addPlayerToSession(session, player)
      ws.join(session.id)
      ws.to(session.id).emit('sessionUpdated', session)
      if (typeof callback == 'function') {
        callback(session)
      }
    } else {
      ws.send('Invalid session code')
    }
  }

  const leaveSession = (data: { code: string; name: string }, callback: any) => {
    const sessionId = sessions.findIndex((session) => session.code === data.code)
    let session = sessions[sessionId]
    if (session) {
      const playerIndex = session.players.findIndex((player) => player.name === data.name)
      session.players.splice(playerIndex)
      ws.to(session.id).emit('sessionUpdated', session)
      ws.leave(session.id)
      if (typeof callback == 'function') {
        callback()
      }
    } else {
      ws.send('Invalid session code')
    }
  }

  const disbandSession = (data: { code: string }) => {
    const sessionIndex = sessions.findIndex((session) => session.code === data.code)
    if (sessionIndex > -1) {
      wss.in(sessions[sessionIndex].id).emit('sessionUpdated', null)
      sessions.splice(sessionIndex)
    }
  }

  const startTracking = (data: { sessionId: string }) => {
    const session = sessions.find((session) => session.id === data.sessionId)
    if (session) {
      session.startTracking = true
      ws.to(session.id).emit('trackingStarted', session)
    } else {
      ws.send('Session id not found')
    }
  }

  const rejoinSession = async (data: { name: string; sessionId: string }) => {
    await ws.join(data.sessionId)
    let playerSocket = playerSockets.find((playerSocket) => playerSocket.player.name === data.name)
    if (playerSocket) {
      playerSocket.socket = ws
    } else {
      ws.send('Rejoin session failed')
      return
    }
    let session = sessions.find((session) => session.id === session.id)
    if (session && session.startTracking) {
      ws.emit('trackingStarted')
    } else {
      ws.send('Invalid session id')
    }
  }

  ws.on('createSession', createSession)
  ws.on('joinSession', joinSession)
  ws.on('leaveSession', leaveSession)
  ws.on('disbandSession', disbandSession)
  ws.on('startTracking', startTracking)
  ws.on('rejoinSession', rejoinSession)
}

const addPlayerToSession = (session: Session, newPlayer: Player) => {
  const newPlayers = session.players.filter((player) => {
    return player.name !== newPlayer.name
  })
  newPlayers.push(newPlayer)
  session.players = newPlayers
}

const addPlayerSocket = (ws: any, player: Player) => {
  const newPlayerSockets = playerSockets.filter((playerSocket) => {
    return playerSocket.player.name !== player.name
  })
  newPlayerSockets.push({
    socket: ws,
    player: player,
  })
  playerSockets = newPlayerSockets
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
