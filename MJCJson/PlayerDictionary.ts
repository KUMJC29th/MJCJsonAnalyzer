/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import * as path from "https://deno.land/std/path/mod.ts";

class PlayerDictionary
{
    private map: Map<string, string>;
    private players: string[];

    constructor()
    {
        const filePath = path.join(Deno.cwd(), "Repository", "players.json");
        const content = Deno.readTextFileSync(filePath);
        const items: { nickname: string, name: string }[] = JSON.parse(content);
        this.map = new Map<string, string>(items.map(item => [item.nickname, item.name]));
        this.players = [...new Set<string>(items.map(item => item.name))];
    }

    getPlayerNameByNickname(nickname: string): string
    {
        const name = this.map.get(nickname);
        if (name == null) throw new Error(`Invalid 'nickname' = '${nickname}'`);
        return name;
    }

    getAllPlayers(): readonly string[]
    {
        return [...this.players];
    }
}

const instance = new PlayerDictionary();

export function getPlayerNameByNickname(nickname: string): string
{
    return instance.getPlayerNameByNickname(nickname);
}

export function getAllPlayers(): readonly string[]
{
    return instance.getAllPlayers();
}