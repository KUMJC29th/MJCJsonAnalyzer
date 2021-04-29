/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

export type ShortenedPlayerStat = {
    /** matchesCount */
    readonly m: number;
    /** ranksCount */
    readonly r: number[];
    /** totalIncome */
    readonly i: number;
    /** sumScore  */
    readonly ss: number;
    /** blownAwayCount */
    readonly b: number;
    /** sumShantenCount */
    readonly sc: number;
    /** sumDoraCount */
    readonly d: number;
    /** winLossStats */
    readonly w: {
        /** total */
        readonly t: ShortenedWinLossStat;
        /** riichi */
        readonly r: ShortenedRiichiWinLossStat;
        /** meld */
        readonly m: ShortenedWinLossStat;
        /** dealer */
        readonly d: ShortenedDealerWinLossStat;
    }
    /** yakuCount */
    readonly y: number[];
}

export type ShortenedWinLossStat = {
    /** gamesCount */
    readonly g: number;
    /** winsCount */
    readonly wc: number;
    /** sumWinScore */
    readonly ws: number;
    /** sumDoubles */
    readonly d: number;
    /** selfDrawCount */
    readonly sc: number;
    /** feedingCount */
    readonly fc: number;
    /** sumFeedingScore */
    readonly fs: number;
    /** lossBySelfDrawCount */
    readonly lc: number;
    /** sumLossScoreBySelfDraw */
    readonly ls: number;
    /** sumWinRound */
    readonly wr: number;
    /** sumAllDoraCount */
    readonly sd: number;
}

export type ShortenedRiichiWinLossStat = ShortenedWinLossStat & {
    /** sumRiichiRound */
    readonly rr: number;
    /** preemptiveCount */
    readonly rp: number;
    /** badFormWaitingCount */
    readonly rb: number;
    /** furitenCount */
    readonly rf: number;
    /** trickCount */
    readonly rt: number;
    /** sumHiddenDoraCount */
    readonly sdh: number;
}

export type ShortenedDealerWinLossStat = ShortenedWinLossStat & {
    /** dealerCount */
    readonly dd: number;
    /** sumDealerKeepingCount */
    readonly dk: number;
}

