import * as path from "https://deno.land/std/path/mod.ts";
import "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/ArrayExtensions.ts";
import { getPlayerNameByNickname } from "../MJCJson/PlayerDictionary.ts";
import { PlayerStat } from "../MJCJson/PlayerStat.ts";
import { CountMap } from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/CountMap.ts";
import { getXmlFlatNodes } from "../MjlogToMJCJson/XmlFlatNode.ts";
import { MJson } from "../MJsonToMJCJson/MJson.ts";

function getPlayerStatsYakuRiichiCount(content: string): CountMap<string>
{
    const stats: { readonly name: string, readonly stat: PlayerStat }[] = JSON.parse(content);
    return new CountMap(stats.map(({ name, stat }) => [name, stat.winLossStats.riichi.winsCount] as [string, number]));
}

function* regAllExec(regex: RegExp, s: string)
{
    let match: RegExpExecArray | null = null;
    while ((match = regex.exec(s)) != null)
    {
        yield match;
    }
}

function getPlayersFromMJLog(content: string): readonly string[]
{
    const regPlayer = /n(?<number>\d)="(?<encodedName>[^"]+)"/gu;
    const players = ["", "", "", ""];
    for (const match of regAllExec(regPlayer, content))
    {
        const number = parseInt(match.groups?.["number"] ?? "");
        if (!isNaN(number))
        {
            players[number] = getPlayerNameByNickname(decodeURI(match.groups?.["encodedName"] ?? ""));
        }
    }
    return players;
}

function getYakuRiichiCountFromMJLog(content: string): CountMap<string>
{
    const map = new CountMap<string>();
    const players = getPlayersFromMJLog(content);

    for (const node of getXmlFlatNodes(content))
    {
        if (node.name === "AGARI")
        {
            //const yakuList = node.attrs!.get("yaku")!.split(",");
            const attrYaku = node.attrs?.get("yaku");
            if (attrYaku == null) throw Error(`'yaku' is missing. content = ${content}`);
            const yakuList = attrYaku.split(",");
            if (yakuList.includes("1") || yakuList.includes("21"))
            {
                const playerIndex = parseInt(node.attrs!.get("who")!);
                map.increment(players[playerIndex]);
            }
        }
    } 
    return map;
}

function getYakuRiichiCountFromMJson(content: string): CountMap<string>
{
    const map = new CountMap<string>();
    const mjson: MJson = JSON.parse(content);
    const players = mjson.name;

    for (const game of mjson.log)
    {
        const result = game[16];
        if (result[0] === "和了")
        {
            if (result[2].some(element => element.toString().includes("立直")))
            {
                map.increment(players[result[2][0]]);
            }
            if (result.length === 5 && result[4].some(element => element.toString().includes("立直")))
            {
                map.increment(players[result[4][0]]);
            }
        }
    }
    return map;
}

function countMapEquals<T>(x: CountMap<T>, y: CountMap<T>): boolean
{
    if (x.size !== y.size) return false;
    for (const [key, value] of x.entries())
    {
        if (y.get(key) !== value) return false;
    }
    return true;
}

function displayCountMap<T>(map: CountMap<T>): string
{
    return "{ " + [...map.entries()].map(([key, value]) => `"${key}": ${value}`).join(", ") + " }";
}

const pstatsDir = path.join(Deno.cwd(), "Repository", "output", "player_stats");
const mjlogDir = path.join(Deno.cwd(), "Repository", "input", "mjlog");
const mjsonDir = path.join(Deno.cwd(), "Repository", "input", "mjson");

function getPlayerStatId(filename: string): number | null
{
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
}

async function main(): Promise<void>
{
    const pstatsMap = new Map<number, CountMap<string>>();
    const logMap = new Map<number, CountMap<string>>();

    for await (const { name: filename } of Deno.readDir(pstatsDir))
    {
        const id = getPlayerStatId(filename);
        if (id == null) continue;
        
        const content = await Deno.readTextFile(path.join(pstatsDir, filename));
        const map = getPlayerStatsYakuRiichiCount(content);

        pstatsMap.set(id, map);
    }

    for await (const { name: filename } of Deno.readDir(mjlogDir))
    {
        const id = parseInt(filename.substr(0, 6));
        if (isNaN(id)) continue;

        const content = await Deno.readTextFile(path.join(mjlogDir, filename));
        const map = getYakuRiichiCountFromMJLog(content);

        if (logMap.has(id))
        {
            logMap.set(id, logMap.get(id)!.merge(map));
        }
        else
        {
            logMap.set(id, map);
        }
    }

    for await (const { name: filename } of Deno.readDir(mjsonDir))
    {
        const id = parseInt(filename.substr(0, 6));
        if (isNaN(id)) continue;

        const content = await Deno.readTextFile(path.join(mjsonDir, filename));
        const map = getYakuRiichiCountFromMJson(content);

        if (logMap.has(id))
        {
            logMap.set(id, logMap.get(id)!.merge(map));
        }
        else
        {
            logMap.set(id, map);
        }
    }

    for (const [id, map] of pstatsMap.entries())
    {
        const other = logMap.get(id);
        if (other == null)
        {
            throw Error(`logMap has no entry with its key '${id}'`);
        }
        else
        {
            if (!countMapEquals(map, other))
            {
                throw Error(`Two maps are not equal. pstat = ${displayCountMap(map)}, log = ${displayCountMap(other)}`);
            }
        }
    }
}

Deno.test("Riichi count test", async () => { await main() });