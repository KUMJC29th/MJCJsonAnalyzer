/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import * as path from "https://deno.land/std/path/mod.ts";
import type { Revisions } from "../DB/Revisions.ts";

export async function createDbRevisions(): Promise<Revisions>
{
    const srcFilePath = path.join(Deno.cwd(), "Repository", "output", "db", "revisions.json");
    const inputContent = await Deno.readTextFile(srcFilePath);
    const revisions: Revisions = JSON.parse(inputContent);
    //debug
    //console.log(revisions);

    return revisions;
}