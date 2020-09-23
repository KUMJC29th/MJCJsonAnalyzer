/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { MJsonDrawKind } from "./MJsonDrawKind.ts";

export type MJsonGameResultWin = [
    "和了",
    readonly number[],
    readonly [number, number, number, ...string[]]
];

export type MJsonGameResultWinDouble = [
    "和了",
    readonly number[],
    readonly [number, number, number, ...string[]],
    readonly number[],
    readonly [number, number, number, ...string[]],
];

export type MJsonGameResultDraw = [
    MJsonDrawKind,
    number[]?
];

export type MJsonGameResult = MJsonGameResultWin | MJsonGameResultWinDouble | MJsonGameResultDraw;