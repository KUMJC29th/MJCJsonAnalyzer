/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { MJson } from "./MJson.ts";
import type { Game } from "../MJCJson/Game.ts";
import type { GameResult, GameResultWin, GameResultDraw } from "../MJCJson/GameResult.ts";
import type { EventItem, EventDraw, EventDiscard, EventMeld, EventChow, EventPung, EventConcealedKong, EventOpenKong, EventAdditionalKong } from "../MJCJson/EventItem.ts";
import type { DrawKind } from "../MJCJson/DrawKind.ts";
import { yakuList } from "../MJCJson/Yaku.ts";
import type { YakuDoubles } from "../MJCJson/YakuDoubles.ts";
import type { Match } from "../MJCJson/Match.ts";
import type { Player } from "../MJCJson/Player.ts";
import type { MJsonGameResult } from "./MJsonGameResult.ts";
import type { MJsonDrawKind } from "./MJsonDrawKind.ts";
import { getPlayerNameByNickname } from "../MJCJson/PlayerDictionary.ts";
import "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/ArrayExtensions.ts";

function convertDrawKind(drawKind: MJsonDrawKind): DrawKind
{
    switch (drawKind)
    {
        case "三家和了": return "三家和";
        case "九種九牌": return "九種九牌";
        case "全員不聴": return "荒牌平局";
        case "全員聴牌": return "荒牌平局";
        case "四家立直": return "四家立直";
        case "四槓散了": return "四開槓";
        case "四風連打": return "四風連打";
        case "流し満貫": return "流し満貫";
        case "流局": return "荒牌平局";
        default: throw new Error(`Invalid 'drawKind' = "${drawKind}"`);
    }
}

function parseYakuString(yakuString: string): YakuDoubles
{
    const yakumanMatch = /^([^\(]+)\(役満\)$/.exec(yakuString);
    if (yakumanMatch != null)
    {
        const yakuId = yakuList.findIndex(yaku => yaku === yakumanMatch[1]);
        if (yakuId === -1) throw new Error(`Invalid 'yakuString' = "${yakuString}"`);
        return {
            yakuId,
            doubles: 13
        }
    }
    const match = /^([^\(]+)\((\d+)飜\)$/.exec(yakuString);
    if (match != null) 
    {
        const yakuId = yakuList.findIndex(yaku => yaku === match[1]);
        if (yakuId === -1) throw new Error(`Invalid 'yakuString' = "${yakuString}"`);
        return {
            yakuId,
            doubles: parseInt(match[2], 10)
        };
    }
    throw new Error(`Invalid 'yakuString' = "${yakuString}"`);
}

function parseWinString(winString: string, doubles: number): { readonly points: number, readonly winScore: number }
{
    const points = (function getPoints(): number
    {
        const lessManganMatch = /^(?<points>\d+)符(?<doubles>\d+)飜/.exec(winString);
        if (lessManganMatch != null)
        {
            return parseInt(lessManganMatch.groups!["points"], 10);
        }
        else
        {
            // 満貫以上
            // 符数の情報は失われているので最低限の符数を返す
            switch (doubles)
            {
                case 3: return 70;
                case 4: return 40;
                default: return 20;
            }
        }
    })();

    const matchDealerSelf = /(\d+)点∀$/.exec(winString);
    if (matchDealerSelf != null)
    {
        return {
            points,
            winScore: 3 * parseInt(matchDealerSelf[1], 10)
        };
    }

    const matchSelf = /(\d+)-(\d+)点$/.exec(winString);
    if (matchSelf != null)
    {
        return {
            points,
            winScore: 2 * parseInt(matchSelf[1], 10) + parseInt(matchSelf[2], 10)
        };
    }

    const matchNotSelf = /(\d+)点$/.exec(winString);
    if (matchNotSelf != null)
    {
        return  {
            points,
            winScore: parseInt(matchNotSelf[1], 10)
        };
    }

    throw new Error(`Invalid 'winString' = "${winString}"`);
}

function convertToGameResultWin(scoreIncrements: readonly number[], winInfo: readonly [number, number, number, ...string[]]): GameResultWin
{
    const [player, from, pao, winString, ...yakuStrings] = winInfo;
    const yakuList = yakuStrings.map(yakuString => parseYakuString(yakuString));
    const { points, winScore } = parseWinString(winString, yakuList.sum(({ doubles }) => doubles));
    const ret: GameResultWin = {
        resultKind: "win",
        scoreIncrements,
        player,
        from: from !== player ? from : undefined,
        pao: pao !== player ? pao: undefined,
        winScore,
        points, // 満貫以上だと符数の情報が失われるので、飜数に応じて設定
        yakuList
    }
    return ret;
}

function convertToGameResult(gameResult: MJsonGameResult): GameResult[]
{
    if (gameResult[0] === "和了")
    {
        if (gameResult.length === 3)
        {
            return [convertToGameResultWin(gameResult[1], gameResult[2])];
        }
        else
        {
            return [convertToGameResultWin(gameResult[1], gameResult[2]), convertToGameResultWin(gameResult[3], gameResult[4])];
        }
    }
    else
    {
        const ret: GameResultDraw = {
            scoreIncrements: gameResult[1] ?? [0, 0, 0, 0],
            resultKind: "draw",
            drawKind: convertDrawKind(gameResult[0])
        };
        return [ret];
    }
}

function mjcJsonTileToMJsonTileKind(tile: number): number
{
    switch (tile)
    {
        case 16: return 51;
        case 52: return 52;
        case 88: return 53;
        default:
            {
                const tmp = tile >> 2;
                const color = Math.floor(tmp / 9);
                const num = tmp % 9;
                return 10 * (color + 1) + num + 1;
            }
    }
}

class TileRepository
{
    private map = new Map<number, number[]>();

    constructor()
    {
        for (let color = 0; color < 3; ++color)
        {
            for (let i = 0; i < 9; ++i)
            {
                this.map.set(10 * (color + 1) + i + 1, [3, 2, 1, 0].map(j => 36 * color + 4 * i + j));
            }
            this.map.set(10 * (color + 1) + 5, [3, 2, 1].map(j => 36 * color + 16 + j));
            this.map.set(51 + color, [36 * color + 16]);
        }
        for (let i = 0; i < 7; ++i)
        {
            this.map.set(41 + i, [3, 2, 1, 0].map(j => 108 + 4 * i + j));
        }
    }

    pop(mjsonTile: number): number
    {
        const ret = this.map.get(mjsonTile)?.pop();
        if (ret == null) throw new Error(`Invalid 'mjsonTile' = ${mjsonTile}`);
        return ret;
    }
}

function* splitByLength(s: string, length: number): IterableIterator<string>
{
    for (let i = 0; i < s.length; i += length)
    {
        yield s.substr(i, length);
    }
}

function isIEventKind(s: string): s is "c" | "p" | "a" | "m" | "k"
{
    switch (s)
    {
        case "c":
        case "p":
        case "a":
        case "m":
        case "k":
            return true;
        default:
            return false;
    }
}

function convertToEvent(dealer: number, hands: readonly (readonly number[])[], gainedTiles: readonly (readonly (number | string)[])[], discards: readonly (readonly (number | string)[])[]): { dealtTiles: readonly (readonly number[])[], events: readonly EventItem[] }
{
    const repository = new TileRepository();

    const _hands = hands.map(hand => hand.map(mjsonTile => repository.pop(mjsonTile)));
    const dealtTiles = _hands.map(hand => [...hand]);
    const _gainedTiles = gainedTiles.map((playerGainedTiles, playerIndex) => playerGainedTiles.map(gainedTile => 
        {
            if (typeof gainedTile === "number")
            {
                return { t: gainedTile, p: playerIndex };
            }
            else
            {
                const match = /^((?:\d\d)*)([cpm]\d\d)((?:\d\d)*)$/.exec(gainedTile);
                if (match == null) throw new Error(`Invalid 'gainedTile' = "${gainedTile}"`);
                const k = match[2][0];
                if (!isIEventKind(k)) throw new Error(`Invalid 'k' = "${k}"`);
                return {
                    t: parseInt(match[2].substr(1), 10),
                    k,
                    p: playerIndex,
                    tiles: [...splitByLength(match[1], 2)].map(s => parseInt(s, 10)).concat([...splitByLength(match[3], 2)].map(s => parseInt(s, 10))),
                    from: match[1].length === 0 ? (playerIndex + 3) % 4
                        : match[3].length === 0 ? (playerIndex + 1) % 4
                        : (playerIndex + 2) % 4
                };
            }
        }
    ));
    const _discards = discards.map(playerDiscards => playerDiscards.map(discard =>
        {
            if (typeof discard === "number")
            {
                return { t: discard };
            }
            else
            {
                if (discard.startsWith("r"))
                {
                    return { t: parseInt(discard.substr(1), 10), isRiichi: true };
                }
                else
                {
                    const match = /^((?:\d\d)*)([ak]\d\d)((?:\d\d)*)$/.exec(discard);
                    if (match == null) throw new Error(`Invalid 'discard' = "${discard}"`);
                    if (match[2][0] === "a")
                    {
                        return {
                            kong: "a",
                            tiles: [...splitByLength(match[1], 2)].map(s => parseInt(s, 10)).concat([...splitByLength(match[3], 2)].map(s => parseInt(s, 10))).concat([parseInt(match[2].substr(1), 10)]),
                        }
                    }
                    else
                    {
                        return {
                            kong: "k",
                            tiles: [parseInt(match[2].substr(1), 10)],
                        }
                    }
                    
                }
            } 
        }
    ));

    let discard = -1;
    let drawn = -1;
    let gainPlayer = dealer;
    let discardPlayer = -1;

    // Closure
    function createEvents(): EventItem[]
    {
        const ret: EventItem[] = [];
        for (let i = 0; i < 4; ++i)
        {
            const top = _gainedTiles[(gainPlayer + i) % 4].first();
            if (top == null) continue;
            if (top.from === discardPlayer && top.t === mjcJsonTileToMJsonTileKind(discard))
            {
                // 鳴き
                _gainedTiles[(gainPlayer + i) % 4].shift();
                const tiles: number[] = [];
                const hand = _hands[top.p];
                for (const mjsonTile of top.tiles)
                {
                    const index = hand.findIndex(mjcJsonTile => mjcJsonTileToMJsonTileKind(mjcJsonTile) === mjsonTile);
                    if (index === -1) throw new Error(`Invalid 'hands[${top.p}]'`);
                    tiles.push(...hand.splice(index, 1));
                }
                const eventMeld: EventMeld = {
                    k: top.k,
                    p: top.p,
                    t: discard,
                    from: top.from,
                    tiles
                };
                ret.push(eventMeld);
                if (top.k === "m")
                {
                    // 大明槓のとき
                    // discardsにmjsonTile = 0のダミーが差し込まれているためそれを消費
                    _discards[top.p].shift();
                    // リンシャン牌を新たにツモる
                    const kongDraw = _gainedTiles[top.p].shift();
                    if (kongDraw == null) throw new Error(`Call kong but no draw.`);
                    drawn = repository.pop(kongDraw.t);
                    const eventOpenKongDraw: EventDraw = {
                        k: "t",
                        p: top.p,
                        t: drawn
                    };
                    _hands[top.p].push(drawn);
                    ret.push(eventOpenKongDraw);
                }
                discardPlayer = top.p;
                gainPlayer = top.p;
            }
        }
        if (ret.length === 0)
        {
            const top = _gainedTiles[gainPlayer].shift();
            if (top == null)
            {
                return [];
            }
            drawn = repository.pop(top.t);
            _hands[top.p].push(drawn);
            const eventDraw: EventDraw = {
                k: "t",
                p: gainPlayer,
                t: drawn
            };
            ret.push(eventDraw);
            discardPlayer = top.p;
        }
        while (true)
        {
            const discardTop = _discards[discardPlayer].shift();
            if (discardTop == null) return ret;
            if (discardTop.kong != null)
            {
                if (discardTop.kong === "a")
                {
                    const tiles: number[] = [];
                    for (const mjsonTile of discardTop.tiles)
                    {
                        const index = _hands[discardPlayer].findIndex(mjcJsonTile => mjcJsonTileToMJsonTileKind(mjcJsonTile) === mjsonTile);
                        if (index === -1) throw new Error(`Invalid 'hands[${discardPlayer}]'`);
                        tiles.push(..._hands[discardPlayer].splice(index, 1));
                    }
                    const eventConcealedKong: EventConcealedKong = {
                        k: "a",
                        p: discardPlayer,
                        from: discardPlayer,
                        tiles
                    };
                    ret.push(eventConcealedKong);
                }
                else
                {
                    const index = _hands[discardPlayer].findIndex(mjcJsonTile => mjcJsonTileToMJsonTileKind(mjcJsonTile) === discardTop.tiles[0]);
                    if (index === -1) throw new Error(`Invalid additional kong in 'discards[${discardPlayer}]'`);
                    const eventAdditionalKong: EventAdditionalKong = {
                        k: "k",
                        p: discardPlayer,
                        t: _hands[discardPlayer].splice(index, 1)[0],
                        from: discardPlayer
                    };
                    ret.push(eventAdditionalKong);
                }
                const kongDraw = _gainedTiles[discardPlayer].shift();
                if (kongDraw == null)
                {
                    // リンシャンをツモっていない＝槍槓
                    return ret;
                }
                drawn = repository.pop(kongDraw.t);
                _hands[discardPlayer].push(drawn);
                const eventKongDraw: EventDraw = {
                    k: "t",
                    p: discardPlayer,
                    t: drawn
                };
                ret.push(eventKongDraw);
            }
            else
            {
                // 60はツモ切り
                const discardIndex = discardTop.t === 60 ? _hands[discardPlayer].indexOf(drawn)
                    :  _hands[discardPlayer].findIndex(mjcJsonTile => mjcJsonTileToMJsonTileKind(mjcJsonTile) === discardTop.t);
                if (discardIndex === -1) throw new Error(`Invalid discard: MJsonTileId of discard is ${discardTop.t}, 'hand' = [${_hands[discardPlayer]}]`);
                const eventDiscard: EventDiscard = {
                    k: "d",
                    p: discardPlayer,
                    t: _hands[discardPlayer].splice(discardIndex, 1)[0],
                    isRiichi: discardTop.isRiichi
                };
                ret.push(eventDiscard);
                discard = eventDiscard.t;
                break;
            }
        }
        gainPlayer = (gainPlayer + 1) % 4;
        return ret;
    }

    const ret: EventItem[] = [];
    while (true)
    {
        const events = createEvents();
        if (events.length === 0)
        {
            //debug
            //console.log(`End of the game 'dealer' = ${dealer}`);
            //end debug
            return { dealtTiles, events: ret };
        }
        ret.push(...events);
    }
}

export function convertToMjcJson(id: number, mjson: MJson): Match
{
    const tmpScores = [0, 1, 2, 3].map(i => mjson.sc[2 * i] - 0.1 * i);
    const sortedTmpScores = [...tmpScores].sort((x, y) => y - x);
    const players = [0, 1, 2, 3].map((i): Player => 
        ({
            name: getPlayerNameByNickname(mjson.name[i]),
            score: mjson.sc[2 * i],
            income: mjson.sc[2 * i + 1],
            rank: sortedTmpScores.indexOf(tmpScores[i])
        })
    );
    const games = mjson.log.map((game): Game => 
        {
            const [round, dealerKeepingCount, bets] = game[0];
            const { dealtTiles, events } = convertToEvent(
                round % 4,
                [game[4], game[7], game[10], game[13]],
                [game[5], game[8], game[11], game[14]],
                [game[6], game[9], game[12], game[15]]
            );
            return {
                beginningScores: game[1],
                round,
                dealerKeepingCount,
                bets,
                dora: game[2],
                hiddenDora: game[3].length > 0 ? game[3] : undefined,
                dealtTiles,
                events,
                gameResults: convertToGameResult(game[16])
            };
        }
    );
    return {
        id,
        players,
        games
    };
}

//debug
//export const testConvertToEvent = convertToEvent;