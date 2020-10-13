/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import * as path from "https://deno.land/std/path/mod.ts";
import { FileConverter } from "./FileConverter.ts";
import type { Match } from "../MJCJson/Match.ts";
import { createMjcMatchStat } from "../Analyzing/CreateMatchStats.ts";
import { aggregateFiles } from "./AggregateFiles.ts";
import type { MatchStat } from "../MJCJson/MatchStat.ts";
import { createMjcPlayerStats } from "../Analyzing/CreatePlayerStats.ts";
import { autoBackup } from "./AutoBackup.ts";
import type { PlayerStat } from "../MJCJson/PlayerStat.ts";
import { createDbMatchResults } from "../Analyzing/CreateDbMatchResults.ts";
import { createDbCompetition } from "../Analyzing/CreateDbCompetition.ts";
import { createDbPlayerStats } from "../Analyzing/CreateDbPlayerStats.ts";
import { createDbRevisions } from "../Analyzing/CreateDbRevisions.ts";


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
    const matchStats = await aggregateFiles(
        path.join(Deno.cwd(), "Repository", "output", "match_stats"),
        inputContent => {
            const matchStat: MatchStat = JSON.parse(inputContent);
            return matchStat;
        }
    );

    const outputContent = JSON.stringify([...createMjcPlayerStats(matchStats).entries()].map(([name, stat]) => ({ name, stat })));
    const dstFilePath = path.join(Deno.cwd(), "Repository", "output", "player_stats", "player_stats.json");
    await autoBackup(dstFilePath);
    await Deno.writeTextFile(dstFilePath, outputContent);
    console.log(`Wrote ${dstFilePath}`);
}

async function getPlayerStatsForDb(): Promise<readonly { readonly name: string, readonly stat: PlayerStat }[]>
{
    const srcFilePath = path.join(Deno.cwd(), "Repository", "output", "player_stats", "player_stats.json");
    const inputContent = await Deno.readTextFile(srcFilePath);
    const playerStats: readonly { readonly name: string, readonly stat: PlayerStat }[] = JSON.parse(inputContent);
    return playerStats;
}

export async function writeDb(): Promise<void>
{
    const matches = await aggregateFiles(
        path.join(Deno.cwd(), "Repository", "output", "mjc_json"),
        inputContent => {
            const match: Match = JSON.parse(inputContent);
            return match;
        }
    );
    const matchResults = createDbMatchResults(matches);
    const competition = createDbCompetition(matches);

    const playerStats = createDbPlayerStats(await getPlayerStatsForDb());

    const revisions = await createDbRevisions();

    const db = {
        playerStats,
        matchResults,
        competition,
        revisions
    };

    const dstFilePath = path.join(Deno.cwd(), "Repository", "output", "db", "mjc_db_tenho.json");
    await autoBackup(dstFilePath);
    await Deno.writeTextFile(dstFilePath, JSON.stringify(db));
    console.log(`Output: ${dstFilePath}`);
}