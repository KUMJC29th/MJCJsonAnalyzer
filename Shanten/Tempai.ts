/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/ArrayExtensions.ts";
import { CountMap } from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/CountMap.ts";
import { take, firstOrDefault } from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/IteratorExtensions.ts";
import { cartesianProduct } from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/MathExtensions.ts";

type HandInfo = {
    readonly hand: CountMap<number>;
    readonly numSets: number;
    readonly hasPair: boolean;
}

function* reduceHand(isNumberTiles: boolean, hand: CountMap<number>, numSets: number, hasPair: boolean): IterableIterator<HandInfo>
{
    const threeEntries = take(hand.entries(), 3).map(([tileKind, count]) => ({ tileKind, count }));
    if (threeEntries.length > 0)
    {
        if (threeEntries[0].count >= 3)
        {
            yield* reduceHand(isNumberTiles, new CountMap(hand).decrement(threeEntries[0].tileKind, 3), numSets + 1, hasPair);
        }
        if (threeEntries[0].count === 2 && !hasPair)
        {
            yield* reduceHand(isNumberTiles, new CountMap(hand).decrement(threeEntries[0].tileKind, 2), numSets, true);
        }
        if (isNumberTiles && threeEntries.length >= 3 && threeEntries[1].tileKind === threeEntries[0].tileKind + 1 && threeEntries[2].tileKind === threeEntries[0].tileKind + 2)
        {
            yield* reduceHand(
                isNumberTiles,
                new CountMap(hand).decrement(threeEntries[0].tileKind, 1).decrement(threeEntries[1].tileKind, 1).decrement(threeEntries[2].tileKind),
                numSets + 1,
                hasPair
            );
        }
    }
    else
    {
        yield { hand, numSets, hasPair };
    }
}

export type WaitingForm = {
    readonly tilesKind: readonly number[];
    readonly numTiles: number;
}

function calcRegularWaitingForm(tilesKind: readonly number[], wholeTilesKind: readonly number[]): WaitingForm | null
{
    const numSets = [1, 4, 7, 10, 13].indexOf(tilesKind.length);
    if (numSets === -1) throw Error("'tilesKind.length' should be 1, 4, 7, 10 or 13.");

    const wholeHand = new CountMap<number>().increamentFromArray(wholeTilesKind);
    const additionalTileKindTargets = new Array<number>(34).fill(0).map((_, i) => i).filter(tileKind => wholeHand.get(tileKind) < 4);
    
    const waitingTilesKind = additionalTileKindTargets.filter(additionalTileKind => 
        {
            const colorSplitHands = [...tilesKind, additionalTileKind].sort((x, y) => x - y).reduce((maps, tileKind) =>
                {
                    maps[Math.floor(tileKind / 9)].increment(tileKind);
                    return maps;
                },
                [new CountMap<number>(), new CountMap<number>(), new CountMap<number>(), new CountMap<number>()]
            );
            const reducedHands = colorSplitHands.map((hand, i) => [...reduceHand(i !== 3, hand, 0, false)]);
            return firstOrDefault(cartesianProduct(...reducedHands.filter(handInfo => handInfo.length > 0)), set => set.sum(handInfo => handInfo.numSets) === numSets && set.count(handInfo => handInfo.hasPair) === 1) != null;
        }
    );
    if (waitingTilesKind.length === 0)
    {
        return null;
    }
    const numWaitingTiles = waitingTilesKind.map(tileKind => 4 - wholeHand.get(tileKind)).sum(c => c);
    return {
        tilesKind: waitingTilesKind,
        numTiles: numWaitingTiles
    };
}

function calcSevenPairsWaitingForm(tilesKind: readonly number[]): WaitingForm | null
{
    if (tilesKind.length !== 13) throw Error("'tilesKind.length' should be 13.");

    const hand = new CountMap<number>().increamentFromArray(tilesKind);
    const parts = [...hand.entries()].reduce((acc, [tilesKind, count]) =>
        {
            if (count === 2)
            {
                ++acc.numPairs;
            }
            else if (count === 1)
            {
                acc.singleTileKind = tilesKind;
            }
            return acc;
        },
        {
            numPairs: 0,
            singleTileKind: -1
        }
    );
    if (parts.numPairs === 6)
    {
        return {
            tilesKind: [parts.singleTileKind],
            numTiles: 3
        };
    }
    else
    {
        return null;
    }
}

const orphansTilesKind = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33] as const;

function calcOrphansWaitingForm(tilesKind: readonly number[]): WaitingForm | null
{
    if (tilesKind.length !== 13) throw Error("'tilesKind.length' should be 13.");

    const hand = new CountMap<number>().increamentFromArray(tilesKind);
    const numOrphans = orphansTilesKind.map(tileKind => hand.get(tileKind));
    const numOrphansKind = numOrphans.count(tileKind => hand.get(tileKind) > 0);
    if (numOrphansKind === 13)
    {
        return {
            tilesKind: [...orphansTilesKind],
            numTiles: 39
        };
    }
    else if (numOrphansKind === 12)
    {
        return {
            tilesKind: [numOrphans.find(c => c === 0)!],
            numTiles: 4
        };
    }
    else
    {
        return null;
    }
}

export function calcWaitingForm(tilesKind: readonly number[], wholeTilesKind: readonly number[]): WaitingForm | null
{
    const regularWaitingForm = calcRegularWaitingForm(tilesKind, wholeTilesKind);
    if (regularWaitingForm !== null)
    {
        return regularWaitingForm;
    }
    const sevenPairsWaitingForm = calcSevenPairsWaitingForm(tilesKind);
    if (sevenPairsWaitingForm !== null)
    {
        return sevenPairsWaitingForm;
    }
    const orphansWaitingForm = calcOrphansWaitingForm(tilesKind);
    return orphansWaitingForm;
}
