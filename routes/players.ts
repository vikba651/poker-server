import { Router } from 'express'

import Player from '../models/players'

const router = Router()

// Get all players
router.get('/', async (req: any, res: any) => {
  try {
    const players = await Player.find()
    res.json(players)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// Get one player
router.get('/:id', getPlayer, (req: any, res: any) => {
  res.json(res.player)
})

// Create one player
router.post('/', async (req: any, res: any) => {
  const player = new Player(req.body)
  console.log(req.body)
  try {
    const newPlayer = await player.save()
    res.status(200).json(newPlayer)
  } catch (e: any) {
    res.status(400)
  }
})

// Update one player
router.patch('/:id', getPlayer, async (req: any, res: any) => {
  if (req.body.name != null) {
    res.player.name = req.body.name
  }

  try {
    const updatedPlayer = await res.player.save()
    res.json(res.player)
  } catch (e: any) {
    res.status(400).json({ message: e.message })
  }
})

// Delete one player
router.delete('/:id', getPlayer, async (req: any, res: any) => {
  try {
    await res.player.remove()
    res.json({ message: 'Deleted player' })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

async function getPlayer(req: any, res: any, next: any) {
  let player
  try {
    player = await Player.findById(req.params.id)
    if (player == null) {
      return res.status(404).json({ message: 'Cannot find player' })
    }
  } catch (e: any) {
    return res.status(500).json({ message: e.message })
  }

  res.player = player
  next()
}

// router.post;
export default router
