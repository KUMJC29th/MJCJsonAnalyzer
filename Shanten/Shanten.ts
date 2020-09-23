/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import * as path from "https://deno.land/std/path/mod.ts";
import { CountMap } from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/CountMap.ts";
import "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/ArrayExtensions.ts";

function loadTable(filepath: string): Record<string, readonly(readonly number[])[]>
{
    const content = Deno.readTextFileSync(filepath);
    return JSON.parse(content);
}

const numberTableFilepath = path.join(Deno.cwd(), "Repository", "numbers_table.json");
const numberTable = loadTable(numberTableFilepath);

const honorTableFilepath = path.join(Deno.cwd(), "Repository", "honors_table.json");
const honorTable = loadTable(honorTableFilepath);

export function calcShanten(tilesKind: number[]): number
{
    if (tilesKind.length !== 13) throw new Error("'tilesKind.length' should be 13.");
    const originalHand = new CountMap<number>().increamentFromArray(tilesKind);
    const numTilesKindString = [...new Array(34)].map((_, i) => originalHand.get(i)).join("");
    const colorSplitHandsString = [
        numTilesKindString.substr(0, 9),
        numTilesKindString.substr(9, 9),
        numTilesKindString.substr(18, 9),
        numTilesKindString.substr(27)
    ];

    // numChanges[color][isWithHead][numSets]
    const numChanges = colorSplitHandsString.map((handString, index) => (index !== 3 ? numberTable : honorTable)[handString]);
    
    // dp[color][numSets]
    const dpNoHead = [...new Array(4)].map(_ => new Array<number>(5).fill(0));
    const dpWithHead = [...new Array(4)].map(_ => new Array<number>(5).fill(0));

    // dp[0]を萬子で初期化
    for (let numSets = 0; numSets < 5; ++numSets)
    {
        dpNoHead[0][numSets] = numChanges[0][0][numSets];
        dpWithHead[0][numSets] = numChanges[0][1][numSets];
    }

    // 雀頭なし
    // dp頭無[color + 1][numSets] = min{ dp頭無[color][i] + numChanges頭無[color + 1][numSets - i] }   i = 0, 1, ... , numSets
    for (let color = 0; color < 3; ++color)
    {
        for (let numSets = 0; numSets < 5; ++numSets)
        {
            dpNoHead[color + 1][numSets] = [...new Array(numSets + 1)].map((_, i) => dpNoHead[color][i] + numChanges[color + 1][0][numSets - i]).min(n => n);
        }
    }

    // 雀頭あり
    // dp頭有[color + 1][numSets] = min{ dp頭有[color][i] + numChanges頭無[color + 1][numSets - i], dp頭無[color][i] + numChanges頭有[color + 1][numSets - i] }   i = 0, 1, ... , numSets
    for (let color = 0; color < 3; ++color)
    {
        for (let numSets = 0; numSets < 5; ++numSets)
        {
            dpWithHead[color + 1][numSets] = [...new Array(numSets + 1)]
                .flatMap((_, i) => [
                    dpWithHead[color][i] + numChanges[color + 1][0][numSets - i],
                    dpNoHead[color][i] + numChanges[color + 1][1][numSets - i]
                ]).min(n => n);
        }
    }

    return dpWithHead[3][4] - 1;
}