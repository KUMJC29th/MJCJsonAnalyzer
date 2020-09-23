/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { Game } from "../MJCJson/Game.ts";
import type { ParsedNodeItemRepository } from "./ParsedNodeItemRepository.ts";

export type EndScore = { readonly score: number, readonly income: number };

export abstract class ParsedNodeItem<T>
{
    constructor(
        readonly kind: "playersName" | "game" | "endScores",
        readonly value: T
    )
    {
    }

    abstract setToRepository(repository: ParsedNodeItemRepository): void;
}

export class ParsedNodeItemPlayersName extends ParsedNodeItem<readonly string[]>
{
    constructor(value: readonly string[])
    {
        super("playersName", value);
    }

    setToRepository(repository: ParsedNodeItemRepository): void
    {
        repository.playersName = this.value;
    }
}

export class ParsedNodeItemGame extends ParsedNodeItem<Game>
{
    constructor(value: Game)
    {
        super("game", value);
    }

    setToRepository(repository: ParsedNodeItemRepository): void
    {
        repository.setGame(this.value);
    }
}

export class ParsedNodeItemEndScores extends ParsedNodeItem<readonly EndScore[]>
{
    constructor(value: readonly EndScore[])
    {
        super("endScores", value);
    }

    setToRepository(repository: ParsedNodeItemRepository): void
    {
        repository.endScores = this.value;
    }
}