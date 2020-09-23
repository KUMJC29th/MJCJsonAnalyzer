/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import { XmlFlatNode, getXmlFlatNodes } from "./XmlFlatNode.ts";
import type { Game } from "../MJCJson/Game.ts";
import type { GameResult, GameResultWin, GameResultDraw } from "../MJCJson/GameResult.ts";
import type { EventItem, EventDraw, EventDiscard, EventMeld, EventChow, EventPung, EventConcealedKong, EventOpenKong, EventAdditionalKong } from "../MJCJson/EventItem.ts";
import type { DrawKind } from "../MJCJson/DrawKind.ts";
import type { Match } from "../MJCJson/Match.ts";
import type { Player } from "../MJCJson/Player.ts";
import { ParsedNodeItem, EndScore, ParsedNodeItemPlayersName, ParsedNodeItemGame, ParsedNodeItemEndScores } from "./ParsedNodeItem.ts";
import { getPlayerNameByNickname } from "../MJCJson/PlayerDictionary.ts";
import { createParsedNodeItemRepository } from "./ParsedNodeItemRepository.ts";
import "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/ArrayExtensions.ts";
import { splitToIntegers } from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/StringExtensions.ts";

function parseInitNode(node: XmlFlatNode): Game
{
    const seed = splitToIntegers(node.attrs!.get("seed")!);
    const [round, dealerKeepingCount, bets] = seed;
    const dora = [seed[5]];
    const beginningScores = splitToIntegers(node.attrs!.get("ten")!).map(sc => 100 * sc) as readonly number[];
    const dealtTiles: ReadonlyArray<ReadonlyArray<number>> = [0, 1, 2, 3].map(n => 
        {
            const tmp = splitToIntegers(node.attrs!.get(`hai${n}`)!);
            tmp.sort((x, y) => x - y);
            return tmp as readonly number[];
        }
    );
    return { beginningScores, round, dealerKeepingCount, bets, dora, dealtTiles, events: [], gameResults: [] };
}

function parseWinNode(node: XmlFlatNode, scoresBefore: number[]): GameResultWin
{
    const [points, winScore] = splitToIntegers(node.attrs!.get("ten")!);
    const player = parseInt(node.attrs!.get("who")!, 10);
    const fromTmp = parseInt(node.attrs!.get("fromWho")!, 10);
    const from = fromTmp === player ? undefined : fromTmp;
    const pao = undefined;
    const yakumanAttr = node.attrs!.get("yakuman");
    const yakuList = (yakumanAttr != null) ? splitToIntegers(yakumanAttr).map(yakuId => ({ yakuId, doubles: 13 }))
        : [...splitToIntegers(node.attrs!.get("yaku")!).divide(2)].map(tuple => ({ yakuId: tuple[0], doubles: tuple[1] })).filter(yd => yd.doubles !== 0);
    // sc属性の増減値は供託による減少を考慮しないので、そのままでは使用できない。
    const scoresAfter = [...splitToIntegers(node.attrs!.get("sc")!).divide(2)].map(sc => 100 * (sc[0] + sc[1]));
    return {
        scoreIncrements: scoresAfter.zip(scoresBefore, (a, b) => a - b),
        resultKind: "win",
        player,
        from,
        pao,
        winScore,
        points,
        yakuList
    };
}

function getDrawKind(drawType: string): DrawKind
{
    switch (drawType)
    {
        case "yao9": return "九種九牌";
        case "reach4": return "四家立直";
        case "ron3": return "三家和";
        case "kan4": return "四開槓";
        case "kaze4": return "四風連打";
        case "nm": return "流し満貫";
        default: return "荒牌平局";
    }
}

function parseDrawNode(node: XmlFlatNode, scoresBefore: number[]): GameResultDraw
{
    const drawKind = getDrawKind(node.attrs!.get("type") ?? "");
    const scoresAfter = [...splitToIntegers(node.attrs!.get("sc")!).divide(2)].map(sc => 100 * (sc[0] + sc[1]));
    return {
        scoreIncrements: scoresAfter.zip(scoresBefore, (a, b) => a - b),
        resultKind: "draw",
        drawKind
    };
}

function parseMeldNode(node: XmlFlatNode): EventMeld
{
    const player = parseInt(node.attrs!.get("who")!, 10);
    const m = parseInt(node.attrs!.get("m")!, 10);

    if ((m & 0x0004) > 0)
    {
        // チー
        const t = m >> 10;
        const tq = Math.floor(t / 3);
        const tr = t % 3;
        const min = 9 * Math.floor(tq / 7) + tq % 7;
        const mods = [0, 1, 2].map(i => m >> (2 * i + 3) & 3);
        const tiles = [0, 1, 2].map(i => 4 * (min + i) + mods[i]);
        const tile = tiles[tr];
        tiles.splice(tr, 1);
        const ret: EventChow = { k: "c", p: player, t: tile, from: (player + 3) % 4, tiles };
        return ret;
    }
    else if ((m & 0x0008) > 0)
    {
        // ポン
        const t = m >> 10;
        const tq = Math.floor(t / 3);
        const tr = t % 3;
        const notUsed = m >> 5 & 3;
        const tiles = [0, 1, 2, 3].filter(i => i !== notUsed).map(i => 4 * tq + i)
        const tile = tiles[tr];
        tiles.splice(tr, 1);
        const ret: EventPung = { k: "p", p: player, t: tile, from: (player + (m & 3)) % 4, tiles };
        return ret;
    }
    else if ((m & 0x0010) > 0)
    {
        // 小明槓
        // ポンとは種別フラグが異なるだけであとは同じ
        const t = m >> 10;
        const tq = Math.floor(t / 3);
        const tile = 4 * tq + (m >> 5 & 3);
        const ret: EventAdditionalKong = { k: "k", p: player, t: tile, from: player };
        return ret;
    }
    else
    {
        // 暗槓・大明槓
        const pos = m & 3;
        const tile = m >> 8;
        if (pos === 0)
        {
            const ret: EventConcealedKong = { k: "a", p: player, from: player, tiles: [0, 1, 2, 3].map(i => (tile >> 2) * 4 + i) };
            return ret;
        }
        else
        {
            const ret: EventOpenKong = { k: "m", p: player, t: tile, from: (player + pos) % 4, tiles: [0, 1, 2, 3].map(i => (tile >> 2) * 4 + i).except([tile]) };
            return ret;
        }
    }
}

function parseEventNode(node: XmlFlatNode, isRiichi: readonly boolean[]): EventItem
{
    
    switch (node.name[0])
    {
        case "T": { const ret: EventDraw = { k: "t", p: 0, t: parseInt(node.name.substr(1), 10) }; return ret; }
        case "U": { const ret: EventDraw = { k: "t", p: 1, t: parseInt(node.name.substr(1), 10) }; return ret; }
        case "V": { const ret: EventDraw = { k: "t", p: 2, t: parseInt(node.name.substr(1), 10) }; return ret; }
        case "W": { const ret: EventDraw = { k: "t", p: 3, t: parseInt(node.name.substr(1), 10) }; return ret; }
        case "D": { const ret: EventDiscard = { k: "d", p: 0, t: parseInt(node.name.substr(1), 10), isRiichi: isRiichi[0] ? true : undefined }; return ret; }
        case "E": { const ret: EventDiscard = { k: "d", p: 1, t: parseInt(node.name.substr(1), 10), isRiichi: isRiichi[1] ? true : undefined }; return ret; }
        case "F": { const ret: EventDiscard = { k: "d", p: 2, t: parseInt(node.name.substr(1), 10), isRiichi: isRiichi[2] ? true : undefined }; return ret; }
        case "G": { const ret: EventDiscard = { k: "d", p: 3, t: parseInt(node.name.substr(1), 10), isRiichi: isRiichi[3] ? true : undefined }; return ret; }
        case "N": return parseMeldNode(node);
        default: throw new Error(`'name' of 'node' = '${node.name[0]}' is invalid.`);
    }
}

function* parseNodes(nodes: IterableIterator<XmlFlatNode>): IterableIterator<ParsedNodeItem<any>>
{
    let playersNameExamined = false;
    let gameInit: Game | null = null;
    let dora: number[] = [];
    let events: EventItem[] = [];
    let isRiichi = [false, false, false, false];
    let gameResults: GameResult[] = [];
    let hiddenDora: number[] = [];
    let currentScores = [25000, 25000, 25000, 25000];
    let endScores: EndScore[] = [];
    for (const node of nodes)
    {
        switch (node.name)
        {
            case "UN":
                {
                    if (!playersNameExamined)
                    {
                        const playersName = [0, 1, 2, 3].map(i => getPlayerNameByNickname(decodeURIComponent(node.attrs!.get(`n${i}`)!)));
                        playersNameExamined = true;
                        yield new ParsedNodeItemPlayersName(playersName);
                    }
                }
                break;
            case "BYE":
                break;
            case "AGARI":
                {
                    const result = parseWinNode(node, currentScores);
                    gameResults.push(result);
                    currentScores = currentScores.zip(result.scoreIncrements, (c, i) => c + i);
                    // 裏ドラ存在チェック
                    if (hiddenDora.length === 0)
                    {
                        hiddenDora = splitToIntegers(node.attrs!.get("doraHaiUra") ?? "");
                    }
                    // 終局チェック
                    const endAttr = node.attrs!.get("owari");
                    if (endAttr != null)
                    {
                        const sc = splitToIntegers(endAttr);
                        endScores = [0, 1, 2, 3].map(i => ({ score: 100 * sc[2 * i], income: sc[2 * i + 1] }));
                    }
                }
                break;
            case "RYUUKYOKU":
                {
                    const result = parseDrawNode(node, currentScores);
                    gameResults.push(result);
                    currentScores = currentScores.zip(result.scoreIncrements, (c, i) => c + i);
                    // 終局チェック
                    const endAttr = node.attrs!.get("owari");
                    if (endAttr != null)
                    {
                        const sc = splitToIntegers(endAttr);
                        endScores = [0, 1, 2, 3].map(i => ({ score: 100 * sc[2 * i], income: sc[2 * i + 1] }));
                    }
                }
                break;
            default:
                {
                    if (gameInit != null && gameResults.length > 0)
                    {
                        const game: Game = {
                            beginningScores: gameInit.beginningScores,
                            round: gameInit.round,
                            dealerKeepingCount: gameInit.dealerKeepingCount,
                            bets: gameInit.bets,
                            dora,
                            hiddenDora: hiddenDora.length > 0 ? hiddenDora : undefined,
                            dealtTiles: gameInit.dealtTiles,
                            events,
                            gameResults
                        };
                        yield new ParsedNodeItemGame(game);
                        gameInit = null;
                        dora = [];
                        events = [];
                        isRiichi = [false, false, false, false];
                        gameResults = [];
                        hiddenDora = [];
                    }

                    if (node.name === "INIT")
                    {
                        gameInit = parseInitNode(node);
                        dora = [...gameInit.dora];
                    }
                    else if (gameInit != null)
                    {
                        switch (node.name)
                        {
                            case "REACH":
                                {
                                    const player = parseInt(node.attrs!.get("who")!, 10);
                                    const step = node.attrs!.get("step");
                                    // step="1"ならisRiichiフラグを立てておく
                                    // （実際にIEventItemを吐き出すのは直後の打牌のとき）
                                    // step="2"ならisRiichiフラグをfalseに戻す
                                    isRiichi[player] = step === "1";
                                }
                                break;
                            case "DORA":
                                {
                                    const tile = parseInt(node.attrs!.get("hai")!, 10);
                                    dora.push(tile);
                                }
                                break;
                            default:
                                events.push(parseEventNode(node, isRiichi));
                                break;
                        }
                    }
                }
                break;
        }
    }
    if (endScores.length === 0) throw new Error("End Score is lacking.");
    yield new ParsedNodeItemEndScores(endScores);
}

export function parseMatch(id: number, fileContent: string): Match
{
    const nodes = getXmlFlatNodes(fileContent);
    const repository = createParsedNodeItemRepository([...parseNodes(nodes)]);
    const tmpScores = repository.endScores.map((sc, i) => sc.score - 0.1 * i);
    const sortedTmpScores = [...tmpScores].sort((x, y) => y - x);
    const players = [0, 1, 2, 3].map(i => 
        {
            const ret: Player = {
                name: repository.playersName[i],
                score: repository.endScores[i].score,
                income: repository.endScores[i].income,
                rank: sortedTmpScores.indexOf(tmpScores[i])
            };
            return ret;
        }
    );
    const ret: Match = {
        id,
        games: repository.games,
        players
    };
    return ret;
}

