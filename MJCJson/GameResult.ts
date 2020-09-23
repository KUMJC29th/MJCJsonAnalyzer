/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { DrawKind } from "./DrawKind.ts";
import type { YakuDoubles } from "./YakuDoubles.ts";

type GameResultBase = {
    readonly resultKind: "win" | "draw";
    readonly scoreIncrements: readonly number[];
}

export type GameResultWin = GameResultBase & {
    readonly resultKind: "win";
    readonly player: number;
    readonly from?: number;
    readonly pao?: number;
    readonly winScore: number;
    readonly points: number; // 符
    readonly yakuList: readonly YakuDoubles[];
}

export type GameResultDraw = GameResultBase & {
    readonly resultKind: "draw";
    readonly drawKind: DrawKind;
}

export type GameResult = GameResultWin | GameResultDraw;