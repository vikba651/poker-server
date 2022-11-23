import dotenv from 'dotenv'
import express, { Express, json, Request, Response } from 'express'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import * as mongoose from 'mongoose'
import * as bodyParser from 'body-parser'
import { networkInterfaces } from 'os'

import roundsRouter from './routes/rounds'
import playersRouter from './routes/players'

dotenv.config()

const app: Express = express()
const server = createServer(app)

const nets = networkInterfaces()
let localAddr: string

try {
  localAddr = nets.en0?.find((net) => net.family === 'IPv4')?.address ?? 'localhost'
} catch (error) {
  console.log('Could not get local IP')
}

const port: number = process.env.PORT ? +process.env.PORT : 8999
server.listen(port, () => {
  console.log(`Server started on http://${localAddr}:${port} :)`)
})

mongoose.connect(`${process.env.DATABASE_URL}`, (error) => {
  if (error) {
    console.log('Could not connect to Mongoose')
  } else {
    console.log('Connected to Mongoose')
  }
})

// ****** HTTP STUFF ******

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/rounds', roundsRouter)
app.use('/players', playersRouter)

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript server running')
})

// ******* WEB SOCKET STUFF *******

const wss = new Server(server, {
  cors: {
    origin: '*',
  },
})

const clients: Socket[] = []

wss.on('connection', (ws: Socket) => {
  clients.push(ws)
  console.log('Connected:', ws.id.substring(0, 3))

  ws.on('createSession', (data: { name: string; location: any }) => {
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
  })

  ws.on('joinSession', (data: { code: string; name: string }) => {
    let session = sessions.find((session) => session.code === data.code)
    if (session) {
      session.players.push(data.name)
      ws.join(session.id)
      wss.in(session.id).emit('sessionUpdated', session)
    } else {
      ws.send('Invalid session code')
    }
  })

  ws.on('updateTableCards', (data: { cards: any; sessionId: string }) => {
    const tableCards = data.cards
    const sessionId = data.sessionId
    ws.to(sessionId).emit('tableCardsUpdated', tableCards)
  })

  ws.on('startTracking', (data: { sessionId: string }) => {
    const sessionId = data.sessionId
    ws.to(sessionId).emit('trackingStarted')
  })

  ws.on('onNewDeal', (data: { sessionId: string }) => {
    const sessionId = data.sessionId
    ws.to(sessionId).emit('newDeal')
  })

  ws.on('disconnect', () => {
    console.log('Disconnected:', ws.id.substring(0, 3))
    const i = clients.indexOf(ws)
    clients.splice(i, 1)
  })

  ws.onAny((eventName) => {
    console.log('Emitted:', eventName)
  })
})

let sessions: Session[] = []
interface Session {
  id: string
  code: string
  creator: string
  players: string[]
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
