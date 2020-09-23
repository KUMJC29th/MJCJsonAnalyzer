/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { YakuDoubles } from "./YakuDoubles.ts";

export type GameStat = {
    readonly isDealer: boolean;
    readonly dealtShantenCount: number;
    readonly dealtDoraCount: number;
    readonly melds: boolean;
    readonly riichiStat?: RiichiStat;
    readonly winStat?: WinGameStat;
    readonly lossStats?: readonly LossGameStat[];
}

export type WinGameStat = {
    readonly winScore: number;
    readonly isSelfDraw: boolean;
    readonly winRound: number;
    readonly yakuList: readonly YakuDoubles[];
}

export type LossGameStat = {
    readonly scoresLoss: number;
    readonly isFeeding: boolean;
}

export type RiichiStat = {
    readonly riichiRound: number;
    readonly isPreemptive: boolean;
    readonly isBadFormWaiting: boolean;
    readonly waitingKind?: "furiten" | "trick";
}