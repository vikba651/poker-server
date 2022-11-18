import dotenv from 'dotenv'
import express, { Express, json, Request, Response } from 'express'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import * as mongoose from 'mongoose'
import * as bodyParser from 'body-parser'

import roundsRouter from './routes/rounds'
import playersRouter from './routes/players'

dotenv.config()

const app: Express = express()
const server = createServer(app)

mongoose.connect(`${process.env.DATABASE_URL}`, (error) => {
  if (error) {
    console.log('Could not connect to Mongoose')
  } else {
    console.log('Connected to Mongoose')
  }
})

const port: number = process.env.PORT ? +process.env.PORT : 8999
server.listen(port, () => {
  console.log(`Server started on http://localhost:${port} :)`)
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

wss.on('connection', (ws: Socket) => {
  // console.log("addr", ws.handshake.address);
  ws.on('createSession', (data) => {
    console.log(`${data.name} wants to create a session`)
    const newSession = {
      id: sessions.length,
      code: createCode(),
      creator: data.name,
      players: [data.name],
    }
    sessions.push(newSession)

    ws.emit('sessionCreated', newSession)
  })

  ws.on('joinSession', (data) => {
    let session = sessions.find((session) => session.code === data.code)
    if (session) {
      session.players.push(data.name)
      wss.emit('sessionUpdated', session)
    } else {
      ws.send('Invalid session code')
    }
  })
})

interface Session {
  id: number
  code: string
  creator: string
  players: string[]
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
