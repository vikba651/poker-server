import { Router } from 'express'
import { PlayerModel } from '../../models/players'
import { RoundModel } from '../../models/rounds'
import { getDealWinProbabilities } from '../../statistics/simulations'
import { PlayerCards } from '../../types/round'
import { RoundStatistics, UserSummary } from '../../types/statistics'
import { createAchievements } from './achievementHelpers'
import {
  getBestHandIndexPlayer,
  getDealSummary,
  getHandResultSummary,
  getPlayerCardQualities,
  getPlayers,
  getRound,
  getWorstHandIndexPlayer,
  queryPlayerHandQualities,
} from './roundsHelpers'

const router = Router()
// Get all rounds
router.get('/', async (req: any, res: any) => {
  try {
    const rounds = await RoundModel.find()
    res.status(200).json(rounds)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
})

router.get('/roundSummary/:id/', getRound, async (req: any, res: any) => {
  const players = getPlayers(res)
  const playerHandQualitiesQuery = await queryPlayerHandQualities(res)

  const deals = res.round.deals
  const playerAchievements = createAchievements(deals, players)

  let userSummaries: UserSummary[] = players.map((player) => {
    const achievement = playerAchievements.find((obj) => obj.playerName === player)?.achievement

    const userSummary = {
      name: player,
      achievement: achievement ?? { title: 'No achievement', description: 'No achievement' },
      handSummary: getHandResultSummary(req, res, player),
      qualities: getPlayerCardQualities(res, playerHandQualitiesQuery, player),
      worstDealIndex: getWorstHandIndexPlayer(req, res, player),
      bestDealIndex: getBestHandIndexPlayer(req, res, player),
    }
    // See if this modifies all user summaries so only last shows.
    return userSummary
  })

  const roundStatistic: RoundStatistics = {
    userSummaries,
    deals: getDealSummary(req, res, playerHandQualitiesQuery),
  }
  res.json(roundStatistic)
})

router.get('/dealWinProbabilities/:id/:dealNumber', getRound, async (req: any, res: any) => {
  let deal = res.round.deals[req.params.dealNumber]
  if (!deal) {
    res.status(500).json({ message: "Deal doesn't exist" })
  }
  deal.playerCards = deal.playerCards.filter((playerCards: PlayerCards) => {
    return playerCards.cards.length == 2
  })
  if (!deal.playerCards) {
    res.status(500).json({ message: "Player Cards doesn't exist on this deal" })
  }
  res.status(200).json(getDealWinProbabilities(deal))
})

// Get one round
router.get('/:id', getRound, async (req: any, res: any) => {
  res.status(200).json(res.roundModel)
})

// // Create one round
// router.post('/', async (req: any, res: any) => {
//   const round = new RoundModel(req.body)

//   try {
//     const newRound = await round.save()
//     res.status(200).json(newRound)
//   } catch (e: any) {
//     res.status(400)
//   }
// })

// // Update one round
// router.patch('/:id', getRound, async (req: any, res: any) => {
//   if (req.body.deals != null) {
//     res.round.deals = req.body.deals
//   }

//   try {
//     const updatedRound = await res.round.save()
//     res.json(res.round)
//   } catch (e: any) {
//     res.status(400).json({ message: e.message })
//   }
// })

// Delete one round
router.delete('/:id/:player', getRound, async (req: any, res: any) => {
  const players = getPlayers(res)

  const playerModels = await PlayerModel.find({
    name: {
      $in: players,
    },
  })

  let playerModel = playerModels.find((playerModel) => {
    return playerModel.name == req.params.player
  })
  if (!playerModel) {
    return res.status(500).json({ message: 'Cannot find player' })
  }

  playerModel.roundIds = playerModel.roundIds.filter((roundId) => {
    return roundId !== req.params.id
  })
  await playerModel.save()

  let existsInPlayers = false
  playerModels.forEach((playerModel) => {
    playerModel.roundIds.forEach((roundId) => {
      if (roundId === req.params.id) {
        existsInPlayers = true
      }
    })
  })

  if (!existsInPlayers) {
    try {
      await RoundModel.deleteOne({ _id: req.params.id })
      res.json({ message: 'Deleted round' })
    } catch (e: any) {
      res.status(500).json({ message: e.message })
    }
  } else {
    res.json({ message: `Round deleted for player ${req.params.player}` })
  }
})

router.post('/roundEarnings/:id/', getRound, async (req: any, res: any) => {
  res.roundModel.earnings = req.body.earnings
  try {
    const updatedRound = await res.roundModel.save()
    res.json(res.roundModel)
  } catch (e: any) {
    res.status(400).json({ message: e.message })
  }
})

// router.post
export default router
