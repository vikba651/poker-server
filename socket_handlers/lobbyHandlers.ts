import { Server, Socket } from 'socket.io'

export function registerLobbyHandlers(wss: Server, ws: Socket) {
  const createSession = (data: { name: string; location: any }) => {
    const session: Session = {
      id: sessions.length.toString(),
      code: createCode(),
      creator: data.name,
      players: [data.name],
    }
    sessions.push(session)
    ws.join(session.id)
    ws.emit('sessionCreated', session)
    ws.broadcast.emit('sendLocation', data.location, session.code)
  }

  const joinSession = (data: { code: string; name: string }) => {
    console.log(data)
    let session = sessions.find((session) => session.code === data.code)
    if (session) {
      session.players.push(data.name)
      ws.join(session.id)
      wss.in(session.id).emit('sessionUpdated', session)
    } else {
      ws.send('Invalid session code')
    }
  }
  interface input {
    sessionId: string
  }

  const startTracking = (data: { sessionId: string }) => {
    const sessionId = data.sessionId
    ws.to(sessionId).emit('trackingStarted')
  }

  ws.on('createSession', createSession)
  ws.on('joinSession', joinSession)
  ws.on('startTracking', startTracking)

  // EventListener('createSession', (code: string, name: string, man: string) => {})

  // function EventListener<T extends (...args: any[]) => void>(eventName: string, fun: Function) {
  //   // console.log(fun.arguments)
  //   console.log(fun.arguments)
  //   // ws.on(eventName, fun)
  // }
}

let sessions: Session[] = []

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function createCode(): string {
  let res = ''
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * ALPHABET.length)
    res = res.concat(ALPHABET[randomIndex])
  }
  return res
}
