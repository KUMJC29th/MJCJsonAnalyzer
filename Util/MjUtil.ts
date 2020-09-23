/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

export function calcWinBaseScore(points: number, doubles: number): number
{
    if (doubles >= 13)
    {
        return doubles >= 26 ? 16000 : 8000;
    }
    else if (doubles >= 5)
    {
        switch (doubles)
        {
            case 12:
            case 11:
                return 6000;
            case 10:
            case 9:
            case 8:
                return 4000;
            case 7:
            case 6:
                return 3000;
            case 5:
                return 2000;
            default:
                throw new Error(`Invalid 'doubles' = ${doubles}`);
        } 
    }
    else
    {
        const baseScore = points << (doubles + 2);
        return baseScore > 2000 ? 2000 : baseScore;
    }
}

export function tileKindToString(tileKind: number): string
{
    const num = tileKind % 9;
    switch (Math.floor(tileKind / 9))
    {
        case 0: return "m" + (num + 1);
        case 1: return "p" + (num + 1);
        case 2: return "s" + (num + 1);
        case 3: return "東南西北白發中"[num];
        default: throw new Error(`Invalid 'tileKind' = ${tileKind}`);
    }
}