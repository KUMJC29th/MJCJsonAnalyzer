/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import { allMJLogToMjcJson } from "./MjlogToMJCJson/main.ts";
import { allMjsonToMjcJson } from "./MJsonToMJCJson/main.ts";
import { writeAllMatchStat, writeDisplayItemsAboutMatches, writePlayerStat, writeDisplayPlayerStats } from "./Analyzing/main.ts";
//import "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/ArrayExtensions.ts";
//import { ListMap } from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/ListMap.ts";
//import { take, firstOrDefault } from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/IteratorExtensions.ts";
//import { DeepMutable } from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/DeepMutable.ts";
//import { Multiplet } from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/Multiplet.ts";
//import * as MathEx from "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/MathExtensions.ts";

async function main(): Promise<void>
{
    for (const arg of Deno.args)
    {
        switch (arg)
        {
            case "-mjlog":
                await allMJLogToMjcJson();
                break;
            case "-mjlog:f":
                await allMJLogToMjcJson(true);
                break;
            case "-mjson":
                await allMjsonToMjcJson();
                break;
            case "-mjson:f":
                await allMjsonToMjcJson(true);
                break;
            case "-matchStat":
                await writeAllMatchStat();
                break;
            case "-matchStat:f":
                await writeAllMatchStat(true);
                break;
            case "-playerStat":
                await writePlayerStat();
                break;
            case "-gas":
                await Promise.all([writeDisplayItemsAboutMatches(), writeDisplayPlayerStats()]);
                break;
            default:
                break;
        }
    }
}

await main();