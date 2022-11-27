// import PlayerCardQuality from '../models/statistics'
// import { ranks, Card } from './constant'

// async function getWinRate(playerCards: Card[], playerAmount: number, callback) {
//   let highCard =
//     ranks.indexOf(playerCards[0].rank) < ranks.indexOf(playerCards[1].rank) ? playerCards[0].rank : playerCards[1].rank
//   let lowCard =
//     ranks.indexOf(playerCards[0].rank) > ranks.indexOf(playerCards[1].rank) ? playerCards[0].rank : playerCards[1].rank

//   const playerCardQuality = await PlayerCardQuality.find({ lowCard, highCard, playerAmount }).then
//   return playerCardQuality.winRate
// }
