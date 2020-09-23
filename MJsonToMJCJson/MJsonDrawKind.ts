/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

const drawKinds = ["流局", "流し満貫", "九種九牌", "四家立直", "三家和了", "四槓散了", "四風連打", "全員聴牌", "全員不聴"] as const;
export type MJsonDrawKind = typeof drawKinds[number];