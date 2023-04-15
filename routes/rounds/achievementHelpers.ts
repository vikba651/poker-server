import { Deal } from '../../types/round'
import { Achievement } from '../../types/statistics'

const achievements = [
  {
    title: 'Floppy King',
    description: getFloppyKingDescription,
    func: getFloppyKing,
  },
  {
    title: 'Ace up the sleeve',
    description: getAceUpTheSleeveDescription,
    func: getAceUpTheSleeve,
  },
  {
    title: 'Boy With The Golden Pants',
    description: getBoyWithTheGoldenPantsDescription,
    func: getBoyWithTheGoldenPants,
  },
]

function getBoyWithTheGoldenPants(deals: Deal[], playerName: string) {
  let pocketPairCount = 0
  for (let deal of deals) {
    const playerCards = deal.playerCards.find((playerCards) => playerCards.name === playerName)
    if (playerCards && playerCards.cards.length === 2 && playerCards.cards[0].rank === playerCards.cards[1].rank) {
      pocketPairCount += 1
    }
  }
  return pocketPairCount
}

function getBoyWithTheGoldenPantsDescription(value: number) {
  return `Got ${value} pocket pairs`
}

function getAceUpTheSleeve(deals: Deal[], playerName: string) {
  return getRandomInt(3)
}

function getAceUpTheSleeveDescription(value: number) {
  return `Got ${value} ace up the damn sleeve`
}

function getFloppyKing(deals: Deal[], playerName: string) {
  return getRandomInt(3)
}

function getFloppyKingDescription(value: number) {
  return `Got ${value} floppy ass flush`
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max)
}

export function createAchievements(deals: Deal[], playerNames: string[]) {
  // Create achievementScores
  let achievementScores = getAchievementScores(deals, playerNames)

  let playerAchievements: { playerName: string; achievement: Achievement }[] = []
  let achievers = []
  // Find player with largest achievement score
  for (let achievement of achievementScores) {
    const highestScore = achievement.scores.reduce((prev, current) => {
      return prev.score > current.score ? prev : current
    })
    // Don't add to achievements if player already has one
    const isAchiever = achievers.find((achiever) => achiever === highestScore.playerName)
    if (!isAchiever && highestScore.score > 0) {
      const descriptionFunc = achievements.find((obj) => obj.title === achievement.title)?.description
      if (descriptionFunc) {
        const playerName = highestScore.playerName
        playerAchievements.push({
          playerName: playerName,
          achievement: {
            title: achievement.title,
            description: descriptionFunc(highestScore.score),
          },
        })
        achievers.push(playerName)
        if (achievers.length === playerNames.length) {
          break
        }
      }
    }
  }
  return playerAchievements
}

function getAchievementScores(deals: Deal[], playerNames: string[]): AchievementScores[] {
  let allAchievementScores: AchievementScores[] = []
  for (let achievement of achievements) {
    const achievementScores: AchievementScores = { title: achievement.title, scores: [] }
    for (let playerName of playerNames) {
      const score = achievement.func(deals, playerName)
      achievementScores.scores.push({
        playerName,
        score,
      })
    }
    allAchievementScores.push(achievementScores)
  }

  return allAchievementScores
}

interface AchievementScores {
  title: string
  scores: {
    playerName: string
    score: number
  }[]
}
