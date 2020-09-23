/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import * as path from "https://deno.land/std/path/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";

function splitFilePath(filePath: string): { dirName: string, fileNameWithoutExtension: string, extension: string }
{
    const separatorIndex = filePath.lastIndexOf("\\");
    const dirName = separatorIndex >= 0 ? filePath.substr(0, separatorIndex) : "";
    const fileName = filePath.substr(separatorIndex + 1);
    const dotIndex = fileName.lastIndexOf(".");
    const [fileNameWithoutExtension, extension] = dotIndex >= 0 ? [fileName.substr(0, dotIndex), fileName.substr(dotIndex)]
        : [fileName, ""];
    return {
        dirName,
        fileNameWithoutExtension,
        extension
    }
}

function toShortDateString(date: Date): string
{
    function paddingZero(n: number): string
    {
        return ("00" + n).slice(-2);
    }
    return `${paddingZero(date.getFullYear() % 100)}${paddingZero(date.getMonth() + 1)}${paddingZero(date.getDate())}${paddingZero(date.getHours())}${paddingZero(date.getMinutes())}${paddingZero(date.getSeconds())}`;
}

export async function autoBackup(filePath: string): Promise<void>
{
    const targetFileExists = await exists(filePath);
    if (targetFileExists)
    {
        const fileStat = await Deno.stat(filePath);
        const modifiedDate = fileStat.mtime;
        const { dirName, fileNameWithoutExtension, extension } = splitFilePath(filePath);
        const dstDir = path.join(dirName, "backup");
        const dstFilePath = path.join(dstDir, fileNameWithoutExtension + (modifiedDate != null ? toShortDateString(modifiedDate) : "null") + extension);
        const dirExists = await exists(dstDir);
        if (!dirExists)
        {
            await Deno.mkdir(dstDir);
        }
        const dstFileExists = await exists(dstFilePath);
        if (dstFileExists) throw new Error(`Cannot backup ${filePath}. Already exists ${dstFilePath}.`);
        await Deno.rename(filePath, dstFilePath);
        console.log(`Backup ${filePath}.`);
    }
}