import { Router } from 'express'
// const Round = require('../models/rounds')

import { RoundModel } from '../models/rounds'

const router = Router()
// Get all rounds
router.get('/', async (req: any, res: any) => {
  try {
    const rounds = await RoundModel.find()
    res.json(rounds)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

// Get one round
router.get('/:id', getRound, (req: any, res: any) => {
  res.json(res.round)
})

// Create one round
router.post('/', async (req: any, res: any) => {
  const round = new RoundModel(req.body)

  try {
    const newRound = await round.save()
    res.status(200).json(newRound)
  } catch (e: any) {
    res.status(400)
  }
})

// Update one round
router.patch('/:id', getRound, async (req: any, res: any) => {
  if (req.body.deals != null) {
    res.round.deals = req.body.deals
  }

  try {
    const updatedRound = await res.round.save()
    res.json(res.round)
  } catch (e: any) {
    res.status(400).json({ message: e.message })
  }
})

// Delete one round
router.delete('/:id', getRound, async (req: any, res: any) => {
  try {
    await res.round.remove()
    res.json({ message: 'Deleted round' })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

async function getRound(req: any, res: any, next: any) {
  let round
  try {
    round = await RoundModel.findById(req.params.id)
    if (round == null) {
      return res.status(404).json({ message: 'Cannot find round' })
    }
  } catch (e: any) {
    return res.status(500).json({ message: e.message })
  }

  res.round = round
  next()
}

// router.post
export default router
