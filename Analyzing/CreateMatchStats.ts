/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { Game } from "../MJCJson/Game.ts";
import type { Match } from "../MJCJson/Match.ts";
import type { GameStat, RiichiStat, WinGameStat, LossGameStat } from "../MJCJson/GameStat.ts";
import type { MatchStat } from "../MJCJson/MatchStat.ts";
import { ListMap } from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/ListMap.ts";
import { calcWaitingForm } from "../Shanten/Tempai.ts";
import { calcShanten } from "../Shanten/Shanten.ts";
import { calcWinBaseScore } from "../Util/MjUtil.ts";
import "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/ArrayExtensions.ts";

function roundUpToHundred(x: number): number
{
    return Math.ceil(x / 100) * 100;
}

function createLossGameStats(points: number, doubles: number, winPlayer: number, dealer: number, from?: number, pao?: number): readonly { player: number, stat: LossGameStat }[]
{
    if (from != null)
    {
        // ロン
        const score = roundUpToHundred((winPlayer === dealer ? 6 : 4) * calcWinBaseScore(points, doubles));
        //debug
        if (score < 0)
        {
            console.log(`Invalid scoresLoss: points = ${points}, doubles = ${doubles}, score = ${score}`);
        }
        //end debug
        if (pao != null)
        {
            return [0, 1, 2, 3].map(i => 
                ({
                    player: i,
                    stat: {
                        scoresLoss: (i === from ? score / 2 : 0) + (i === pao ? score / 2 : 0),
                        isFeeding: true
                    }
                })
            ).filter(item => item.stat.scoresLoss > 0);
        }
        else
        {
            return [{
                player: from,
                stat: {
                    scoresLoss: score,
                    isFeeding: true
                }
            }];
        }
    }
    else
    {
        // ツモ
        if (pao != null)
        {
            const score = roundUpToHundred((winPlayer === dealer ? 6 : 4) * calcWinBaseScore(points, doubles));
            return [{
                player: pao,
                stat: {
                    scoresLoss: score,
                    isFeeding: true
                }
            }];
        }
        else
        {
            const baseScore = calcWinBaseScore(points, doubles);
            if (winPlayer === dealer)
            {
                return [0, 1, 2, 3].filter(i => i !== winPlayer).map(i => 
                    ({
                        player: i,
                        stat: {
                            scoresLoss: roundUpToHundred(2 * baseScore),
                            isFeeding: false
                        }
                    })
                );
            }
            else
            {
                return [0, 1, 2, 3].filter(i => i !== winPlayer).map(i => 
                    ({
                        player: i,
                        stat: {
                            scoresLoss: i === dealer ? roundUpToHundred(2 * baseScore) : roundUpToHundred(baseScore),
                            isFeeding: false
                        }
                    })
                );
            }
        }
    }
}

function createRiichiStat(handConcealed: readonly number[], handRevealed: readonly number[], discards: readonly number[], riichiRound: number, isPreemptive: boolean): RiichiStat
{
    //const shantenResult = calcShanten(handConcealed, handConcealed.concat(handRevealed));
    const waitingForm = calcWaitingForm(handConcealed.map(tile => tile >> 2), handConcealed.concat(handRevealed.map(tile => tile >> 2)));
    if (waitingForm === null) throw new Error("Invalid 'waitingForm'.");
    const discardsKind = discards.map(discard => discard >> 2);
    const isBadFormWaiting = waitingForm.numTiles < 6;
    
    // フリテンチェック
    for (const tileKind of waitingForm.tilesKind)
    {
        if (discardsKind.indexOf(tileKind) >= 0)
        {
            return {
                riichiRound,
                isPreemptive,
                isBadFormWaiting,
                waitingKind: "furiten"
            };
        }
    }

    // 筋引っ掛けチェック
    // Closure
    function isTrick(waitingTileKind: number): boolean
    {
        if (waitingTileKind < 27)
        {
            const num = waitingTileKind % 9;
            if (num < 3)
            {
                return discardsKind.indexOf(waitingTileKind + 3) >= 0;
            }
            else if (num >= 6)
            {
                return discardsKind.indexOf(waitingTileKind - 3) >= 0;
            }
            else
            {
                return discardsKind.indexOf(waitingTileKind + 3) >= 0 && discardsKind.indexOf(waitingTileKind - 3) >= 0;
            }
        }
        else
        {
            return false;
        }
    }
    // End Closure
    
    return {
        riichiRound,
        isPreemptive,
        isBadFormWaiting,
        waitingKind: waitingForm.tilesKind.some(waitingTileKind => isTrick(waitingTileKind)) ? "trick" : undefined
    };
}

function gameToGameStats(game: Game): readonly GameStat[]
{
    const hands: number[][] = game.dealtTiles as number[][];
    const discards: number[][] = [[], [], [], []];
    const revealed: number[][] = [[], [], [], []];
    const dealtShantenCounts = hands.map(hand => calcShanten(hand.map(tile => tile>> 2)));
    const dealtDoraCounts = hands.map(hand => hand.sum(tile => 
        {
            let c = (tile >> 2) === (game.dora[0] >> 2) ? 1 : 0;
            switch (tile)
            {
                case 16:
                case 52:
                case 88:
                    ++c;
                    break;
                default:
                    break;
            }
            return c;
        }
    ));
    const melds = [false, false, false, false];
    const riichi: (RiichiStat | undefined)[] = [undefined, undefined, undefined, undefined];

    for (const event of game.events)
    {
        const player = event.p;
        switch (event.k)
        {
            case "c":
            case "p":
            case "m":
                {
                    melds[player] = true;
                    hands[player] = hands[player].except(event.tiles);
                    revealed[player].push(...event.tiles);
                    revealed[player].push(event.t);
                }
                break;
            case "a":
                {
                    const tiles = event.tiles;
                    hands[player] = hands[player].except(tiles);
                    revealed[player].push(...tiles);
                }
                break;
            case "d":
                {
                    hands[player] = hands[player].except([event.t]);
                    discards[player].push(event.t);
                    if (event.isRiichi)
                    {
                        // このeventがgame.eventsの最後の要素なら、直後にロンが入るためリーチが通っていない
                        if (event !== game.events[game.events.length - 1])
                        {
                            riichi[player] = createRiichiStat(hands[player], revealed[player], discards[player], discards[player].length, riichi.every(item => item == undefined));
                        }
                    }
                }
                break;
            case "k":
                {
                    hands[player] = hands[player].except([event.t]);
                    revealed[player].push(event.t);
                }
                break;
            case "t":
                hands[player].push(event.t);
                break;
        }
    }

    const winStatsMap = new Map<number, WinGameStat>();
    const lossStatsMap = new ListMap<number, LossGameStat>();
    for (const result of game.gameResults)
    {
        if (result.resultKind === "win")
        {
            const winPlayer = result.player;
            const winStat: WinGameStat = {
                winScore: result.winScore,
                isSelfDraw: result.from == undefined,
                winRound: discards[winPlayer].length + 1,
                yakuList: result.yakuList
            };
            winStatsMap.set(winPlayer, winStat);

            for (const item of createLossGameStats(result.points, result.yakuList.sum(yaku => yaku.doubles), winPlayer, game.round, result.from, result.pao))
            {
                lossStatsMap.add(item.player, item.stat);
            }
        }
        // else は必要ない？
    }

    return [0, 1, 2, 3].map(i =>
        {
            const ret: GameStat = {
                isDealer: i === game.round % 4,
                dealtShantenCount: dealtShantenCounts[i],
                dealtDoraCount: dealtDoraCounts[i],
                melds: melds[i],
                riichiStat: riichi[i],
                winStat: winStatsMap.get(i),
                lossStats: lossStatsMap.get(i)
            };
            return ret;
        }
    );
}

function createDealerKeepingCounts(match: Match): readonly [number, number][]
{
    const map = new Map<number, number>(match.games.map(game => [game.round, game.dealerKeepingCount]));
    return [...map.entries()];
}

export function createMjcMatchStat(match: Match): MatchStat
{
    const stats = match.games.map(game => gameToGameStats(game));
    const dealerKeepingCounts = createDealerKeepingCounts(match);
    return {
        matchId: match.id,
        stats: [0, 1, 2, 3].map(i => (
            {
                player: match.players[i],
                gameStats: stats.map(gameStats => gameStats[i]),
                dealerKeepingCounts: dealerKeepingCounts.filter(([round, _]) => round % 4 === i).map(([_, count]) => count)
            }
        ))
    };
}