/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */
import type { DealerWinLossStat, PlayerStat, RiichiWinLossStat, WinLossStat } from "../MJCJson/PlayerStat.ts";
import type { ShortenedDealerWinLossStat, ShortenedPlayerStat, ShortenedRiichiWinLossStat, ShortenedWinLossStat } from "./ShortenedPlayerStat.ts";

function shortenWinLossStat(winLossStats: WinLossStat): ShortenedWinLossStat
{
    return {
        g: winLossStats.gamesCount,
        wc: winLossStats.winsCount,
        ws: winLossStats.sumWinScore,
        d: winLossStats.sumDoubles,
        sc: winLossStats.selfDrawCount,
        fc: winLossStats.feedingCount,
        fs: winLossStats.sumFeedingScore,
        lc: winLossStats.lossBySelfDrawCount,
        ls: winLossStats.sumLossScoreBySelfDraw,
        wr: winLossStats.sumWinRound,
        sd: winLossStats.sumAllDoraCount
    };
}

function shortenRiichiWinLossStat(riichiWinLossStat: RiichiWinLossStat): ShortenedRiichiWinLossStat
{
    return {
        ...shortenWinLossStat(riichiWinLossStat),
        rr: riichiWinLossStat.sumRiichiRound,
        rp: riichiWinLossStat.preemptiveCount,
        rb: riichiWinLossStat.badFormWaitingCount,
        rf: riichiWinLossStat.furitenCount,
        rt: riichiWinLossStat.trickCount,
        sdh: riichiWinLossStat.sumHiddenDoraCount
    };
}

function shortenDealerWinLossStat(dealerWinLossStat: DealerWinLossStat): ShortenedDealerWinLossStat
{
    return {
        ...shortenWinLossStat(dealerWinLossStat),
        dd: dealerWinLossStat.dealerCount,
        dk: dealerWinLossStat.sumDealerKeepingCount
    };
}

export function shortenPlayerStat(playerStat: PlayerStat): ShortenedPlayerStat
{
    return {
        m: playerStat.matchesCount,
        r: [...playerStat.ranksCount],
        i: playerStat.totalIncome,
        ss: playerStat.sumScore,
        b: playerStat.blownAwayCount,
        sc: playerStat.sumShantenCount,
        d: playerStat.sumDoraCount,
        w: {
            t: shortenWinLossStat(playerStat.winLossStats.total),
            r: shortenRiichiWinLossStat(playerStat.winLossStats.riichi),
            m: shortenWinLossStat(playerStat.winLossStats.meld),
            d: shortenDealerWinLossStat(playerStat.winLossStats.dealer)
        },
        y: [...playerStat.yakuCount]
    };
}
