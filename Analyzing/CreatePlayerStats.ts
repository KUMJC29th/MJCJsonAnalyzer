/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { GameStat } from "../MJCJson/GameStat.ts";
import type { MatchStat } from "../MJCJson/MatchStat.ts";
import { yakuList } from "../MJCJson/Yaku.ts";
import type { PlayerStat, WinLossStat, RiichiWinLossStat, DealerWinLossStat } from "../MJCJson/PlayerStat.ts";
import type { DeepMutable } from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/DeepMutable.ts";
import { getAllPlayers } from "../MJCJson/PlayerDictionary.ts";
import "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/ArrayExtensions.ts";

function createDefaultWinLossStat(): WinLossStat
{
    return {
        gamesCount: 0,
        winsCount: 0,
        sumWinScore: 0,
        sumDoubles: 0,
        selfDrawCount: 0,
        feedingCount: 0,
        sumFeedingScore: 0,
        lossBySelfDrawCount: 0,
        sumLossScoreBySelfDraw: 0,
        sumWinRound: 0
    };
}

function createDefaultRiichiWinLossStat(): RiichiWinLossStat
{
    return {
        ...createDefaultWinLossStat(),
        sumRiichiRound: 0,
        preemptiveCount: 0,
        badFormWaitingCount: 0,
        furitenCount: 0,
        trickCount: 0
    };
}

function createDefaultDealerWinLossStat(): DealerWinLossStat
{
    return {
        ...createDefaultWinLossStat(),
        dealerCount: 0,
        sumDealerKeepingCount: 0
    };
}

function createDefaultPlayerStat(): PlayerStat
{
    return {
        matchesCount: 0,
        ranksCount: [0, 0, 0, 0],
        totalIncome: 0,
        sumScore: 0,
        blownAwayCount: 0,
        sumShantenCount: 0,
        sumDoraCount: 0,
        winLossStats: {
            total: createDefaultWinLossStat(),
            riichi: createDefaultRiichiWinLossStat(),
            meld: createDefaultWinLossStat(),
            dealer: createDefaultDealerWinLossStat()
        },
        yakuCount: new Array(yakuList.length).fill(0)
    };
}

function updateWinLossStat(target: DeepMutable<WinLossStat>, gameStat: GameStat): void
{
    ++target.gamesCount;
    if (gameStat.winStat != null)
    {
        ++target.winsCount;
        target.sumWinScore += gameStat.winStat.winScore;
        target.sumDoubles += gameStat.winStat.yakuList.sum(yaku => yaku.doubles);
        if (gameStat.winStat.isSelfDraw)
        {
            ++target.selfDrawCount;
        }
        target.sumWinRound += gameStat.winStat.winRound;
    }
    if (gameStat.lossStats != null)
    {
        for (const lossStat of gameStat.lossStats)
        {
            if (lossStat.isFeeding)
            {
                ++target.feedingCount;
                target.sumFeedingScore += lossStat.scoresLoss;
            }
            else
            {
                ++target.lossBySelfDrawCount;
                target.sumLossScoreBySelfDraw += lossStat.scoresLoss;
            }
        }
    }
}

export function createMjcPlayerStats(matchStats: readonly MatchStat[]): ReadonlyMap<string, PlayerStat>
{
    const allPlayers = getAllPlayers();
    const map = new Map<string, DeepMutable<PlayerStat>>(allPlayers.map(player => [player, createDefaultPlayerStat()]));
    
    for (const matchStat of matchStats)
    {
        for (const { player, gameStats, dealerKeepingCounts } of matchStat.stats)
        {
            const target = map.get(player.name)!;
            ++target.matchesCount;
            ++target.ranksCount[player.rank];
            target.totalIncome += player.income;
            target.sumScore += player.score;
            target.blownAwayCount += (player.score < 0) ? 1 : 0;
            for (const gameStat of gameStats)
            {
                target.sumShantenCount += gameStat.dealtShantenCount;
                target.sumDoraCount += gameStat.dealtDoraCount;

                if (gameStat.winStat != null)
                {
                    for (const { yakuId } of gameStat.winStat.yakuList)
                    {
                        ++target.yakuCount[yakuId];
                    }
                }

                updateWinLossStat(target.winLossStats.total, gameStat);
                if (gameStat.riichiStat != null)
                {
                    updateWinLossStat(target.winLossStats.riichi, gameStat);
                    target.winLossStats.riichi.sumRiichiRound += gameStat.riichiStat.riichiRound;
                    target.winLossStats.riichi.preemptiveCount += gameStat.riichiStat.isPreemptive ? 1 : 0;
                    target.winLossStats.riichi.badFormWaitingCount += gameStat.riichiStat.isBadFormWaiting ? 1 : 0;
                    switch (gameStat.riichiStat.waitingKind)
                    {
                        case "furiten":
                            ++target.winLossStats.riichi.furitenCount;
                            break;
                        case "trick":
                            ++target.winLossStats.riichi.trickCount;
                            break;
                        default:
                            break;
                    }
                }
                if (gameStat.melds)
                {
                    updateWinLossStat(target.winLossStats.meld, gameStat);
                }
                if (gameStat.isDealer)
                {
                    updateWinLossStat(target.winLossStats.dealer, gameStat);
                }
            }
            target.winLossStats.dealer.dealerCount += dealerKeepingCounts.length;
            target.winLossStats.dealer.sumDealerKeepingCount += dealerKeepingCounts.sum(c => c);
        }
    }

    // 半荘数0のプレイヤーを除外
    const ret = new Map<string, PlayerStat>([...map.entries()].filter(([_, stat]) => stat.matchesCount > 0));

    return ret;
}
