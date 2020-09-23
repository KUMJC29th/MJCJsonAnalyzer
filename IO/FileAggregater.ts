/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import * as path from "https://deno.land/std/path/mod.ts";
import { autoBackup } from "../IO/AutoBackup.ts";

export class FileAggregater<T>
{
    constructor(
        private readonly name: string,
        private readonly srcDir: string,
        private readonly readConvert: (inputContent: string) => T,
        private readonly writeConvert: (items: readonly T[]) => string,
        private readonly dstFilePath: string
    )
    {
    }

    async aggregateAll(): Promise<void>
    {
        console.log(`FileAggregater: ${this.name} begins aggregating.`);

        const items: T[] = [];
        for await (const { name: filename } of Deno.readDirSync(this.srcDir))
        {
            const srcPath = path.join(this.srcDir, filename);
            const inputContent = await Deno.readTextFile(srcPath);
            items.push(this.readConvert(inputContent));
        }
        const outputContent = this.writeConvert(items);

        await autoBackup(this.dstFilePath);
        await Deno.writeTextFile(this.dstFilePath, outputContent);

        console.log(`FileAggregater: ${this.name} ends aggregating.`);
    }
}