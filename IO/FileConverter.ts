/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import * as path from "https://deno.land/std/path/mod.ts";

export class FileConverter
{
    constructor(
        private readonly name: string,
        private readonly srcDir: string,
        private readonly sourceIdSelector: (filename: string) => number | null,
        private readonly convert: (id: number, inputContent: string) => string,
        private readonly dstDir: string,
        private readonly dstFilenameSelector: (id: number) => string,
        private readonly existingIdSelector: (filename: string) => number | null,
    )
    {
    }

    private async *enumerateExistingMatchIds(): AsyncIterableIterator<number>
    {
        for await (const { name: filename } of Deno.readDirSync(this.dstDir))
        {
            const id = this.existingIdSelector(filename);
            if (id != null)
            {
                yield id;
            }
        }
    }

    async convertAll(isForcingAll?: boolean): Promise<void>
    {
        console.log(`FileConverter: ${this.name} begins converting.`);

        const existingIds = new Set<number>();
        for await (const id of this.enumerateExistingMatchIds())
        {
            existingIds.add(id);
        }

        for await (const { name: filename } of Deno.readDirSync(this.srcDir))
        {
            const id = this.sourceIdSelector(filename);
            if (id == null || Number.isNaN(id))
            {
                console.log(`WARN: Invalid filename = "${filename}"`);
            }
            else if (existingIds.has(id) && !(isForcingAll ?? false))
            {
                console.log(`INFO: Skipped id = ${id}`);
            }
            else
            {
                console.log(`INFO: Writing id = ${id}`);
                const srcPath = path.join(this.srcDir, filename);
                const inputContent = await Deno.readTextFile(srcPath);
                const outputContent = this.convert(id, inputContent);
                const dstPath = path.join(this.dstDir, this.dstFilenameSelector(id));
                await Deno.writeTextFile(dstPath, outputContent);
                console.log(`INFO: Wrote id = ${id}`);
            }
        }

        console.log(`FileConverter: ${this.name} ends converting.`);
    }
}