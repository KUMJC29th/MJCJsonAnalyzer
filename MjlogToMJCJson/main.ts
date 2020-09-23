/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import * as path from "https://deno.land/std/path/mod.ts";
import { FileConverter } from "../IO/FileConverter.ts";
import { parseMatch } from "./MJLogParser.ts";

export async function allMJLogToMjcJson(isForcingAll?: boolean): Promise<void>
{
    const converter = new FileConverter(
        allMJLogToMjcJson.name,
        path.join(Deno.cwd(), "Repository", "input", "mjlog"),
        filename => {
            const id = /^(?<id>\d+).xml$/.exec(filename)?.groups?.["id"];
            return id != null ? parseInt(id, 10) : null;
        },
        (id, inputContent) => JSON.stringify(parseMatch(id, inputContent)),
        path.join(Deno.cwd(), "Repository", "output", "mjc_json"),
        id => `${id}.json`,
        filename => {
            const id = /^(?<id>\d+).json$/.exec(filename)?.groups?.["id"];
            return id != null ? parseInt(id, 10) : null;
        }
    );
    await converter.convertAll(isForcingAll);
}