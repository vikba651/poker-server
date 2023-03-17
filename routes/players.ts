import { Router } from 'express'

import { PlayerModel } from '../models/players'
import { RoundModel } from '../models/rounds'
import { Round } from '../types/round'

const router = Router()

// Get player with name
router.post('/', getPlayer, async (req: any, res: any) => {
  if (res.player !== null) {
    res.json(res.player)
  } else {
    res.status(404).json({ message: 'Could not find player' })
  }
})

// Create one player
router.post('/create', async (req: any, res: any) => {
  const player = new PlayerModel(req.body)
  try {
    const newPlayer = await player.save()
    res.status(200).json(newPlayer)
  } catch (e: any) {
    res.status(400)
  }
})

router.post('/rounds', getPlayer, async (req: any, res: any) => {
  if (res.player !== null) {
    const roundIds: string[] = res.player.roundIds
    let rounds: any[] = []
    if (roundIds.length > 0) {
      rounds = await RoundModel.find({ _id: { $in: roundIds } })
    }
    res.status(200).json(rounds)
  } else {
    res.status(404).json({ message: 'Could not find player' })
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

// Get Player Earnings
router.post('/earnings', getPlayer, async (req: any, res: any) => {
  if (res.player !== null) {
    const roundIds: string[] = res.player.roundIds
    let rounds: any[] = []
    if (roundIds.length > 0) {
      rounds = await RoundModel.find({ _id: { $in: roundIds } })
    }

    const playerEarnings = rounds.reduce((playerEarning, round) => {
      const filteredPlayerEarning = round.earnings.filter((earning: any) => {
        return earning.name === res.player.name
      })

      if (filteredPlayerEarning.length > 0) {
        const newPlayerEarning = {
          name: filteredPlayerEarning[0].name,
          startTime: round.startTime,
          earning: filteredPlayerEarning[0].earning,
          roundId: round.id,
        }
        playerEarning.push(newPlayerEarning)
      }
      return playerEarning
    }, [])

    res.json(playerEarnings)

    // const roundsWithEarnings: Round[] = rounds.filter((round: Round)=>{
    //   const playerEarning = round.earnings.filter((earning)=>{
    //     return earning.name === res.player.name
    //   })
    //   return (playerEarning).length > 0
    // })
    // const playerEarnings = roundsWithEarnings.map((round)=>{
    //   return round
    // })
  } else {
    res.status(404).json({ message: 'Could not find player' })
  }
})
async function getPlayer(req: any, res: any, next: any) {
  let player
  try {
    player = await PlayerModel.findOne({ name: req.body.name })
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
