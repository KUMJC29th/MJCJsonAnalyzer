/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { EventItem } from "./EventItem.ts";
import type { GameResult } from "./GameResult.ts";

export type Game = {
    readonly beginningScores: readonly number[];
    readonly round: number;
    readonly dealerKeepingCount: number;
    readonly bets: number;
    readonly dora: readonly number[];
    readonly hiddenDora?: readonly number[];
    readonly dealtTiles: readonly (readonly number[])[];
    readonly events: readonly EventItem[];
    readonly gameResults: readonly GameResult[];
}