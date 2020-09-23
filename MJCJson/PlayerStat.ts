/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

export type PlayerStat = {
    // Statistics for matches
    readonly matchesCount: number;
    readonly ranksCount: number[];
    readonly totalIncome: number;
    readonly sumScore: number;
    readonly blownAwayCount: number;
    // Statistics for games
    readonly sumShantenCount: number;
    readonly sumDoraCount: number;
    readonly winLossStats: {
        readonly total: WinLossStat;
        readonly riichi: RiichiWinLossStat;
        readonly meld: WinLossStat;
        readonly dealer: DealerWinLossStat;
    }
    // Statistics for yaku
    readonly yakuCount: number[];
}

export type WinLossStat = {
    readonly gamesCount: number;
    readonly winsCount: number;
    readonly sumWinScore: number;
    readonly sumDoubles: number;
    readonly selfDrawCount: number;
    readonly feedingCount: number;
    readonly sumFeedingScore: number;
    readonly lossBySelfDrawCount: number;
    readonly sumLossScoreBySelfDraw: number;
    readonly sumWinRound: number;
}

export type RiichiWinLossStat = WinLossStat & {
    readonly sumRiichiRound: number;
    readonly preemptiveCount: number;
    readonly badFormWaitingCount: number;
    readonly furitenCount: number;
    readonly trickCount: number;
}

export type DealerWinLossStat = WinLossStat & {
    readonly dealerCount: number;
    readonly sumDealerKeepingCount: number;
}
