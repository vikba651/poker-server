import * as bodyParser from 'body-parser'
import dotenv from 'dotenv'
import express, { Express, Request, Response } from 'express'
import { createServer } from 'http'
import * as mongoose from 'mongoose'
import { networkInterfaces } from 'os'
import { Server, Socket } from 'socket.io'

import playersRouter from './routes/players'
import roundsRouter from './routes/rounds/rounds'
import { registerLobbyHandlers } from './socket_handlers/lobbyHandlers'
import { registerTrackGameHandlers } from './socket_handlers/trackGameHandlers'
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from './types/websocket'

dotenv.config()

const app: Express = express()
const server = createServer(app)

const nets = networkInterfaces()
let localAddr: string

try {
  if (process.platform === "darwin") {
    localAddr = nets.en0?.find((net) => net.family === 'IPv4')?.address ?? 'localhost'
  } else {
  localAddr = nets.WiFi?.find((net) => net.family === 'IPv4')?.address ?? 'localhost'
}
} catch (error) {
  console.log('Could not get local IP')
}


const port: number = process.env.PORT ? +process.env.PORT : 8999
server
  .listen(port, () => {
    console.log(`Server started on http://${localAddr}:${port} :)`)
  })
  .on('error', function (err) {
    process.once('SIGUSR2', function () {
      process.kill(process.pid, 'SIGUSR2')
    })
    process.on('SIGINT', function () {
      // this is only called on ctrl+c, not restart
      process.kill(process.pid, 'SIGINT')
    })
  })

mongoose.connect(`${process.env.DATABASE_URL}`, (error) => {
  if (error) {
    console.log('Could not connect to Mongoose')
  } else {
    console.log('Connected to Mongoose')
    // for (let i = 1; i < 8; i++) {
    //   simulateAllPlayerCards(i, 10000)
    // }
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

const wss = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: {
    origin: '*',
  },
})

const clients: Socket[] = []

wss.on('connection', (ws: Socket) => {
  clients.push(ws)
  console.log('Connected:', ws.id.substring(0, 3))
  registerTrackGameHandlers(wss, ws)
  registerLobbyHandlers(wss, ws)

  ws.on('disconnect', () => {
    console.log('Disconnected:', ws.id.substring(0, 3))
    const i = clients.indexOf(ws)
    clients.splice(i, 1)
  })

  ws.onAny((eventName) => {
    console.log('Event:', eventName)
  })
})
