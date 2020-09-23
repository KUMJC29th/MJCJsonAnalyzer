/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

const drawKinds = ["荒牌平局", "九種九牌", "四家立直", "三家和", "四開槓", "四風連打", "流し満貫"] as const;

export type DrawKind = typeof drawKinds[number];