/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { PlayerGameResult } from "./PlayerGameResult.ts";
import type { Game } from "./Game.ts";

export type Match = {
    readonly id: number;
    readonly players: readonly PlayerGameResult[];
    readonly games: readonly Game[];
}