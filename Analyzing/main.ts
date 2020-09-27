/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import * as path from "https://deno.land/std/path/mod.ts";
import type { Match } from "../MJCJson/Match.ts";
import { createMjcMatchStat } from "./CreateMatchStats.ts";
import { FileConverter } from "../IO/FileConverter.ts";
import { FileAggregater } from "../IO/FileAggregater.ts";
import type { MatchStat } from "../MJCJson/MatchStat.ts";
import { createMjcPlayerStats } from "./CreatePlayerStats.ts";
import type { PlayerStat } from "../MJCJson/PlayerStat.ts";
import { createMatchResults } from "./CreateDisplayMatchResults.ts";
import { autoBackup } from "../IO/AutoBackup.ts";
import { createDisplayPlayerStats } from "./CreateDisplayPlayerStats.ts";
import { createCompetition } from "./CreateCompetition.ts";

export async function writeAllMatchStat(isForcingAll?: boolean): Promise<void>
{
    const converter = new FileConverter(
        writeAllMatchStat.name,
        path.join(Deno.cwd(), "Repository", "output", "mjc_json"),
        filename => {
            const id = /^(?<id>\d+).json$/.exec(filename)?.groups?.["id"];
            return id != null ? parseInt(id, 10) : null;
        },
        (_, inputContent) => {
            const match: Match = JSON.parse(inputContent);
            const matchStat = createMjcMatchStat(match);
            return JSON.stringify(matchStat);
        },
        path.join(Deno.cwd(), "Repository", "output", "match_stats"),
        id => `stat${id}.json`,
        filename => {
            const id = /^stat(?<id>\d+).json$/.exec(filename)?.groups?.["id"];
            return id != null ? parseInt(id, 10) : null;
        }
    );
    await converter.convertAll(isForcingAll);
}

export async function writePlayerStat(): Promise<void>
{
    const aggregater = new FileAggregater(
        writePlayerStat.name,
        path.join(Deno.cwd(), "Repository", "output", "match_stats"),
        inputContent => {
            const matchStat: MatchStat = JSON.parse(inputContent);
            return matchStat;
        },
        [
            {
                dstFilePath: path.join(Deno.cwd(), "Repository", "output", "player_stats", "player_stats.json"),
                convert: matchStats => JSON.stringify([...createMjcPlayerStats(matchStats).entries()].map(([name, stat]) => ({ name, stat })))
            }
        ]
    );
    await aggregater.aggregateAll();
}

export async function writeDisplayItemsAboutMatches(): Promise<void>
{
    const aggregater = new FileAggregater(
        writeDisplayItemsAboutMatches.name,
        path.join(Deno.cwd(), "Repository", "output", "mjc_json"),
        inputContent => {
            const match: Match = JSON.parse(inputContent);
            return match;
        },
        [
            {
                dstFilePath: path.join(Deno.cwd(), "Repository", "output", "gas", "match_results.json"),
                convert: matches => JSON.stringify(createMatchResults(matches))
            },
            {
                dstFilePath: path.join(Deno.cwd(), "Repository", "output", "gas", "competition.json"),
                convert: matches => JSON.stringify(createCompetition(matches))
            }
        ]
    )
    {
    }
    await aggregater.aggregateAll();
}

export async function writeDisplayPlayerStats(): Promise<void>
{
    console.log("Writing player stats for display.");

    const srcFilePath = path.join(Deno.cwd(), "Repository", "output", "player_stats", "player_stats.json");
    const inputContent = await Deno.readTextFile(srcFilePath);
    const playerStats: readonly { readonly name: string, readonly stat: PlayerStat }[] = JSON.parse(inputContent);
    const dstFilePath = path.join(Deno.cwd(), "Repository", "output", "gas", "player_stats.json");
    const outputContent = JSON.stringify(createDisplayPlayerStats(playerStats));
    await autoBackup(dstFilePath);
    await Deno.writeTextFile(dstFilePath, outputContent);

    console.log("Wrote player stats for display.");
}
