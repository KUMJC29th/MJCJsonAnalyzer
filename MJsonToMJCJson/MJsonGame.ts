/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { MJsonGameResult } from "./MJsonGameResult.ts";

export type MJsonGame = [
    // 0: [局, 本, 供託]
    readonly number[],
    // 1: 局開始時点数
    readonly number[],
    // 2: 表ドラ
    readonly number[],
    // 3: 裏ドラ
    readonly number[],
    // 4: 1人目配牌
    readonly number[],
    // 5: 1人目入手牌
    readonly (number | string)[],
    // 6: 1人目捨牌
    readonly (number | string)[],
    // 7: 2人目配牌
    readonly number[],
    // 8: 2人目入手牌
    readonly (number | string)[],
    // 9: 2人目捨牌
    readonly (number | string)[],
    // 10: 3人目配牌
    readonly number[],
    // 11: 3人目入手牌
    readonly (number | string)[],
    // 12: 3人目捨牌
    readonly (number | string)[],
    // 13: 4人目配牌
    readonly number[],
    // 14: 4人目入手牌
    readonly (number | string)[],
    // 15: 4人目捨牌
    readonly (number | string)[],
    // 16: 和了など
    MJsonGameResult
];