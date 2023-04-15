import { DealSummary } from '../types/statistics'
import { getHandResult } from '../statistics/poker-logic'

export function StraightClutchScore(name: string, dealSummaries: DealSummary[]) {
  let score = 0
  for (const dealSummary of dealSummaries) {
    const playerCards = dealSummary.playerCards.find((playerCards) => {
      return playerCards.name == name
    })
    if (playerCards) {
      if (playerCards.hand !== 'Straight') {
        continue
      }
      if (getHandResult([...playerCards.cards, ...dealSummary.tableCards.slice(0, 4)]).hand == 'Straight') {
        continue
      }
      score += 1
    }
  }
  return score
}
