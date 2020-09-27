/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import { getAllPlayers } from "../MJCJson/PlayerDictionary.ts"
import type { Match } from "../MJCJson/Match.ts";
import type { Competition, CompetitionResult } from "../GoogleAppsScript/Competition.ts";

type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

export function createCompetition(matches: readonly Match[]): Competition
{
    const players = getAllPlayers();
    const items: readonly (readonly Mutable<CompetitionResult>[])[] = [...new Array(players.length)].map(() => [...new Array(players.length)].map(() => ({ income: 0, win: 0, loss: 0 })));
    
    for (const match of matches)
    {
        const results = match.players.map(({name, income, rank}) =>
            ({
                playerIndex: players.indexOf(name),
                income,
                rank
            })
        );
        for (let i = 0; i < results.length; ++i)
        {
            for (let j = i + 1; j < results.length; ++j)
            {
                const x = results[i];
                const y = results[j];
                items[x.playerIndex][y.playerIndex].income += x.income;
                items[y.playerIndex][x.playerIndex].income += y.income;
                if (x.rank < y.rank)
                {
                    ++items[x.playerIndex][y.playerIndex].win;
                    ++items[y.playerIndex][x.playerIndex].loss;
                }
                else
                {
                    ++items[x.playerIndex][y.playerIndex].loss;
                    ++items[y.playerIndex][x.playerIndex].win;
                }
            }
        }
    }

    return {
        players,
        items: items.map(row => row.map(cell => cell.win + cell.loss === 0 ? null : cell))
    };
}