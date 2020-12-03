/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import { getAllPlayers } from "../MJCJson/PlayerDictionary.ts"
import type { Match } from "../MJCJson/Match.ts";
import type { MatchResult } from "../DB/MatchResult.ts";

export function createDbMatchResults(matches: readonly Match[]): readonly MatchResult[]
{
    const players = getAllPlayers();
    return matches.map(match =>
        ({
            d: Math.floor(match.id / 100),
            g: match.id % 100,
            i: match.players.reduce((acc, player) =>
                {
                    acc[players.indexOf(player.name)] = player.income;
                    return acc;
                },
                [...new Array(players.length)].fill(null) as (number | null)[]
            )
        })
    );
}
