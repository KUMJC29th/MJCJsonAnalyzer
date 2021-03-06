/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { GameStat } from "./GameStat.ts";
import type { PlayerGameResult } from "./PlayerGameResult.ts";

export type MatchStat = {
    readonly matchId: number;
    readonly stats: {
        readonly player: PlayerGameResult;
        readonly gameStats: readonly GameStat[];
        readonly dealerKeepingCounts: readonly number[];
    }[];
}