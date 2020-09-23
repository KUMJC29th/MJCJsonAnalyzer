/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { Game } from "../MJCJson/Game.ts";
import type { EndScore, ParsedNodeItem } from "./ParsedNodeItem.ts";

export interface IParsedNodeItemRepository
{
    readonly playersName: readonly string[];
    readonly games: readonly Game[];
    readonly endScores: readonly EndScore[];
}

export class ParsedNodeItemRepository implements IParsedNodeItemRepository
{
    private _playersName = [] as readonly string[];
    private readonly _games = [] as Game[];
    private _endScores = [] as readonly EndScore[];

    get playersName(): readonly string[]
    {
        return this._playersName;
    }
    set playersName(value: readonly string[])
    {
        this._playersName = value;
    }

    get games(): readonly Game[]
    {
        return this._games;
    }
    setGame(value: Game): void
    {
        this._games.push(value);
    }

    get endScores(): readonly EndScore[]
    {
        return this._endScores;
    }
    set endScores(value: readonly EndScore[])
    {
        this._endScores = value;
    }
}

export function createParsedNodeItemRepository(items: ParsedNodeItem<any>[]): IParsedNodeItemRepository
{
    const repository = new ParsedNodeItemRepository();
    for (const item of items)
    {
        item.setToRepository(repository);
    }
    return repository as IParsedNodeItemRepository;
}