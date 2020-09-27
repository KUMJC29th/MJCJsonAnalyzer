/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import type { NumericValueType } from "./NumericValueType.ts";

type SingleColumn = {
    readonly field: string,
    readonly headerName: string,
    readonly valueType: NumericValueType
};

type ParentColumn = {
    readonly headerName: string,
    readonly children: readonly SingleColumn[]
};

export type PlayerStats = {
    readonly columns: readonly (ParentColumn | SingleColumn)[],
    readonly stats: readonly {
        readonly name: string,
        readonly stat: Readonly<Record<string, number>>
    }[]
};