/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import * as path from "https://deno.land/std/path/mod.ts";

export async function aggregateFiles<T>(srcDir: string, convert: (content: string) => T): Promise<T[]>
{
    const items: T[] = [];
    for await (const { name: filename } of Deno.readDir(srcDir))
    {
        const srcPath = path.join(srcDir, filename);
        const inputContent = await Deno.readTextFile(srcPath);
        items.push(convert(inputContent));
    }
    return items;
}

