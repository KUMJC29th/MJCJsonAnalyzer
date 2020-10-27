/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import { allMJLogToMjcJson } from "./MjlogToMJCJson/main.ts";
import { allMjsonToMjcJson } from "./MJsonToMJCJson/main.ts";
import { writeAllMatchStats, writeAllPlayerStats, writeDb } from "./IO/main.ts";

async function main(): Promise<void>
{
    for (const arg of Deno.args)
    {
        switch (arg)
        {
            case "mjlog":
                await allMJLogToMjcJson();
                break;
            case "mjlog:f":
                await allMJLogToMjcJson(true);
                break;
            case "mjson":
                await allMjsonToMjcJson();
                break;
            case "mjson:f":
                await allMjsonToMjcJson(true);
                break;
            case "matchStat":
                await writeAllMatchStats();
                break;
            case "matchStat:f":
                await writeAllMatchStats(true);
                break;
            case "playerStat":
                await writeAllPlayerStats();
                break;
            case "playerStat:f":
                await writeAllPlayerStats(true);
                break;
            case "db":
                await writeDb();
                break;
            default:
                console.log(`WARNING: Invalid sub command '${arg}'`);
                break;
        }
    }
}

await main();