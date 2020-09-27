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
        private readonly writeConverters: readonly { dstFilePath: string, convert: (items: readonly T[]) => string }[]
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

        for (const { dstFilePath, convert } of this.writeConverters)
        {
            const outputContent = convert(items);
            await autoBackup(dstFilePath);
            await Deno.writeTextFile(dstFilePath, outputContent);
            console.log(`Output ${dstFilePath}`);
        }

        console.log(`FileAggregater: ${this.name} ends aggregating.`);
    }
}