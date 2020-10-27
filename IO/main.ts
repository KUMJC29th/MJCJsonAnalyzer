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
import type { ShortenedPlayerStat } from "../DB/ShortenedPlayerStat.ts";
import { shortenPlayerStat } from "../DB/ShortenPlayerStat.ts";
import { enumerable, IGrouping } from "https://github.com/matcher-ice/linq-ts/raw/master/src/mod.ts";


export async function writeAllMatchStats(isForcingAll?: boolean): Promise<void>
{
    const converter = new FileConverter(
        writeAllMatchStats.name,
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

export async function writeAllPlayerStats(isForcingAll?: boolean): Promise<void>
{
    console.log("'writeAllPlayerStats' begins.");

    const matchStatsDir = path.join(Deno.cwd(), "Repository", "output", "match_stats");
    const playerStatsDir = path.join(Deno.cwd(), "Repository", "output", "player_stats");

    const existingPlayerStatsId = isForcingAll ? [] as number[]
        : enumerable(Deno.readDirSync(playerStatsDir)).select(dirEntry => {
            const filename = dirEntry.name;
            const id = /^pstat(?<id>\d+).json$/.exec(filename)?.groups?.["id"];
            if (id != null && id.length === 6)
            {
                const n = parseInt(id);
                return !isNaN(n) ? n : null;
            }
            else
            {
                return null;
            }
        }).ofType((item: number | null): item is number => item !== null).toArray();

    const matchStatsFilename = enumerable(Deno.readDirSync(matchStatsDir)).select(dirEntry => dirEntry.name);
    const matchStatsFilenameGroup = matchStatsFilename.groupBy(filename => {
        const id = /^stat(?<id>\d+).json$/.exec(filename)?.groups?.["id"];
        if (id != null && id.length === 8)
        {
            const n = parseInt(id);
            return !isNaN(n) ? Math.floor(n / 100) : null;
        }
        else
        {
            return null;
        }
    }).ofType((item: IGrouping<number | null, string>): item is IGrouping<number, string> => item.key !== null).where(item => existingPlayerStatsId.indexOf(item.key) === -1);

    await Promise.all(matchStatsFilenameGroup.select(async group =>
    {
        const dateNum = group.key;
        console.log(`INFO: Writing dateNum = ${dateNum}`);
        const matchStats = (await Promise.all(group.select(filename => {
            const filepath = path.join(matchStatsDir, filename);
            return Deno.readTextFile(filepath);
        }))).map((content: string): MatchStat => JSON.parse(content));
        const playerStats = createMjcPlayerStats(matchStats);
        const outputContent = JSON.stringify([...playerStats.entries()].map(([name, stat]) => ({ name, stat })));
        const dstFilepath = path.join(playerStatsDir, `pstat${dateNum}.json`);
        await Deno.writeTextFile(dstFilepath, outputContent);
        console.log(`INFO: Wrote dateNum = ${dateNum}`);
    }));

    console.log("'writeAllPlayerStats' ends.");
}

// obs?
type DbPlayerStats = {
    readonly dateNum: number,
    readonly stats: readonly {
        readonly name: string,
        readonly stat: ShortenedPlayerStat
    }[]
}[];
async function createDbPlayerStats(): Promise<Readonly<DbPlayerStats>>
{
    const ret: DbPlayerStats = [];
    const playerStatsDir = path.join(Deno.cwd(), "Repository", "output", "player_stats");
    for await (const { name: filename } of Deno.readDir(playerStatsDir))
    {
        const id = /^pstat(?<id>\d+).json$/.exec(filename)?.groups?.["id"];
        if (id == null || id.length !== 6) continue;
        const dateNum = parseInt(id);
        if (isNaN(dateNum)) continue;
        const content = await Deno.readTextFile(path.join(playerStatsDir, filename));
        const stats: { readonly name: string, readonly stat: PlayerStat }[] = JSON.parse(content);
        ret.push({ dateNum, stats: stats.map(({ name, stat }) => ({ name, stat: shortenPlayerStat(stat) })) });
    }
    return ret;
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

    const playerStats = await createDbPlayerStats();

    const db = {
        playerStats,
        matchResults,
        competition,
    };

    const dstFilePath = path.join(Deno.cwd(), "Repository", "output", "db", "mjc_db_tenho_v2.json");
    await autoBackup(dstFilePath);
    await Deno.writeTextFile(dstFilePath, JSON.stringify(db));
    console.log(`Output: ${dstFilePath}`);
}