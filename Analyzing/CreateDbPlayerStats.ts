/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

import "https://github.com/matcher-ice/ts_utils_and_extensions/raw/master/ArrayExtensions.ts";
import type { PlayerStat, RiichiWinLossStat, WinLossStat } from "../MJCJson/PlayerStat.ts";
import type { PlayerStats } from "../DB/PlayerStats.ts"
import { ParentPlayerStatsColumn, PlayerStatsColumn, SinglePlayerStatsColumn } from "../DB/PlayerStatsColumn.ts";
import { honorYakuList, yakuList } from "../MJCJson/Yaku.ts";
import type { NumericValueType } from "../DB/NumericValueType.ts";

function createWinLossStatsChildrenColumns(fieldPrefix: string, winLossStatsSelector: (stat: PlayerStat) => WinLossStat): readonly SinglePlayerStatsColumn[]
{
    return [
        new SinglePlayerStatsColumn(`${fieldPrefix}_wp`, "和了率", "probability", stat => {
            const winLossStats = winLossStatsSelector(stat);
            return winLossStats.winsCount / winLossStats.gamesCount;
        }),
        new SinglePlayerStatsColumn(`${fieldPrefix}_aw`, "平均\n和了点", "integer", stat => {
            const winLossStats = winLossStatsSelector(stat);
            return winLossStats.sumWinScore / winLossStats.winsCount;
        }),
        new SinglePlayerStatsColumn(`${fieldPrefix}_ad`, "平均\n飜数", "decimal", stat => {
            const winLossStats = winLossStatsSelector(stat);
            return winLossStats.sumDoubles / winLossStats.winsCount;
        }),
        new SinglePlayerStatsColumn(`${fieldPrefix}_sp`, "ツモ率", "probability", stat => {
            const winLossStats = winLossStatsSelector(stat);
            return winLossStats.selfDrawCount / winLossStats.winsCount;
        }),
        new SinglePlayerStatsColumn(`${fieldPrefix}_ar`, "平均\n和了\n巡目", "decimal", stat => {
            const winLossStats = winLossStatsSelector(stat);
            return winLossStats.sumWinRound / winLossStats.winsCount;
        }),
        new SinglePlayerStatsColumn(`${fieldPrefix}_fp`, "放銃率", "probability", stat => {
            const winLossStats = winLossStatsSelector(stat);
            return winLossStats.feedingCount / winLossStats.gamesCount;
        }),
        new SinglePlayerStatsColumn(`${fieldPrefix}_af`, "平均\n放銃点", "integer", stat => {
            const winLossStats = winLossStatsSelector(stat);
            return winLossStats.sumFeedingScore / winLossStats.feedingCount;
        }),
        new SinglePlayerStatsColumn(`${fieldPrefix}_lp`, "ツモ\nられ\n率", "probability", stat => {
            const winLossStats = winLossStatsSelector(stat);
            return winLossStats.lossBySelfDrawCount / winLossStats.gamesCount;
        }),
        new SinglePlayerStatsColumn(`${fieldPrefix}_al`, "平均\nツモ\n失点", "integer", stat => {
            const winLossStats = winLossStatsSelector(stat);
            return winLossStats.sumLossScoreBySelfDraw / winLossStats.lossBySelfDrawCount;
        }),
    ];
}

function createWinLossStatsColumns(fieldPrefix: string, mainHeader: string, winLossStatsSelector: (stat: PlayerStat) => WinLossStat): ParentPlayerStatsColumn
{
    return new ParentPlayerStatsColumn(
        mainHeader,
        createWinLossStatsChildrenColumns(fieldPrefix, winLossStatsSelector)
    );
}

function createRiichiWinLossStatsColumns(winLossStatsSelector: (stat: PlayerStat) => RiichiWinLossStat): ParentPlayerStatsColumn
{
    return new ParentPlayerStatsColumn(
        "立直時",
        [
            ...createWinLossStatsChildrenColumns("r", winLossStatsSelector),
            new SinglePlayerStatsColumn("r_pr", "先制\n立直率", "probability", stat => {
                const riichiWinLossStats = winLossStatsSelector(stat);
                return riichiWinLossStats.preemptiveCount / riichiWinLossStats.gamesCount;
            }),
            new SinglePlayerStatsColumn("r_fr", "フリ\nテン\n立直率", "probability", stat => {
                const riichiWinLossStats = winLossStatsSelector(stat);
                return riichiWinLossStats.furitenCount / riichiWinLossStats.gamesCount;
            }),
            new SinglePlayerStatsColumn("r_tr", "引っ\n掛け\n立直率", "probability", stat => {
                const riichiWinLossStats = winLossStatsSelector(stat);
                return riichiWinLossStats.trickCount / riichiWinLossStats.gamesCount;
            }),
            new SinglePlayerStatsColumn("r_br", "愚形\n立直率", "probability", stat => {
                const riichiWinLossStats = winLossStatsSelector(stat);
                return riichiWinLossStats.badFormWaitingCount / riichiWinLossStats.gamesCount;
            }),
        ]
    );
}

function createYakuMeanColumns(): ParentPlayerStatsColumn
{
    return new ParentPlayerStatsColumn(
        "役出現期待値",
        [
            new SinglePlayerStatsColumn("yp", "平和", "probability", stat => stat.yakuCount[yakuList.indexOf("平和")] / stat.winLossStats.total.winsCount),
            new SinglePlayerStatsColumn("yt", "断幺九", "probability", stat => stat.yakuCount[yakuList.indexOf("断幺九")] / stat.winLossStats.total.winsCount),
            new SinglePlayerStatsColumn(
                "yf",
                "飜牌",
                "probability",
                stat => honorYakuList.sum(yaku => stat.yakuCount[yakuList.indexOf(yaku)]) / stat.winLossStats.total.winsCount
            )
        ]
    );
}

function createYakuCountColumns(): ParentPlayerStatsColumn
{
    return new ParentPlayerStatsColumn(
        "役出現数",
        yakuList.map((yaku, yakuIndex) => new SinglePlayerStatsColumn(`y${yakuIndex}`, yaku, "integer", stat => stat.yakuCount[yakuIndex]))
    );
}

function createPlayerStatsColumns(): readonly PlayerStatsColumn[]
{
    return [
        new SinglePlayerStatsColumn("mc", "半荘数", "integer", stat => stat.matchesCount),
        new SinglePlayerStatsColumn("ti", "総合\n収支", "integer", stat => stat.totalIncome),
        new SinglePlayerStatsColumn("ar", "平均\n順位", "decimal", stat => stat.ranksCount.map((count, index) => ({ count, index })).sum(({ count, index }) => count * (index + 1)) / stat.matchesCount),
        new ParentPlayerStatsColumn("順位率", [0, 1, 2, 3].map(element => new SinglePlayerStatsColumn(`r${element}`, `${element + 1}位`, "probability", stat => stat.ranksCount[element] / stat.matchesCount))),
        new SinglePlayerStatsColumn("as", "平均\n点数", "integer", stat => stat.sumScore / stat.matchesCount),
        new SinglePlayerStatsColumn("aw", "飛び率", "probability", stat => stat.blownAwayCount / stat.matchesCount),
        new SinglePlayerStatsColumn("gc", "総局数", "integer", stat => stat.winLossStats.total.gamesCount),
        new ParentPlayerStatsColumn("配牌時",
            [
                new SinglePlayerStatsColumn("das", "平均\n聴向数", "decimal", stat => stat.sumShantenCount / stat.winLossStats.total.gamesCount),
                new SinglePlayerStatsColumn("dad", "平均\nドラ数", "decimal", stat => stat.sumDoraCount / stat.winLossStats.total.gamesCount)
            ]
        ),
        new SinglePlayerStatsColumn("rp", "立直率", "probability", stat => stat.winLossStats.riichi.gamesCount / stat.winLossStats.total.gamesCount),
        new SinglePlayerStatsColumn("arr", "平均\n立直\n巡目", "decimal", stat => stat.winLossStats.riichi.sumRiichiRound / stat.winLossStats.riichi.gamesCount),
        new SinglePlayerStatsColumn("mp", "副露率", "probability", stat => stat.winLossStats.meld.gamesCount / stat.winLossStats.total.gamesCount),
        createWinLossStatsColumns("t", "合計", stat => stat.winLossStats.total),
        createRiichiWinLossStatsColumns(stat => stat.winLossStats.riichi),
        createWinLossStatsColumns("m", "副露時", stat => stat.winLossStats.meld),
        createWinLossStatsColumns("d", "親番", stat => stat.winLossStats.dealer),
        createYakuMeanColumns(),
        createYakuCountColumns()
    ];
}

function originalColumnsToColumn(originalColumn: SinglePlayerStatsColumn): {
    field: string,
    headerName: string,
    valueType: NumericValueType
}
{
    return {
        field: originalColumn.field,
        headerName: originalColumn.headerName,
        valueType: originalColumn.valueType
    };
}

function formatValue(value: number, valueType: NumericValueType): number
{
    switch (valueType)
    {
        case "integer":
        case "signedInteger":
            return Math.round(value * 100) / 100;
        case "probability":
            return Math.round(value * 1000000) / 1000000;
        case "decimal":
            return Math.round(value * 100000) / 100000;
    }
}

export function createDbPlayerStats(playerStats: readonly { readonly name: string, readonly stat: PlayerStat }[]): PlayerStats
{
    const originalColumns = createPlayerStatsColumns();

    const columns = originalColumns.map(originalColumn =>
        originalColumn instanceof SinglePlayerStatsColumn ? originalColumnsToColumn(originalColumn)
            : {
                headerName: originalColumn.headerName,
                children: originalColumn.children.map(childColumn => originalColumnsToColumn(childColumn))
            }
    );

    const stats = playerStats.map(({ name, stat }) =>
        ({
            name,
            stat: originalColumns.reduce((acc, originalColumn) =>
                {
                    if (originalColumn instanceof SinglePlayerStatsColumn)
                    {
                        acc[originalColumn.field] = formatValue(originalColumn.getValue(stat), originalColumn.valueType);
                    }
                    else
                    {
                        for (const childColumn of originalColumn.children)
                        {
                            acc[childColumn.field] = formatValue(childColumn.getValue(stat), childColumn.valueType);
                        }
                    }
                    return acc;
                },
                {} as Record<string, number>
            )
        })
    );

    const ret: PlayerStats = {
        columns,
        stats
    };
    return ret;
}

// for tests
export function playerStatsColumnsDuplicatedFieldNameTest(): void
{
    const set = new Set<string>();
    const columns = createPlayerStatsColumns();

    for (const column of columns)
    {
        if (column instanceof SinglePlayerStatsColumn)
        {
            if (set.has(column.field)) throw new Error("Duplicated field.");
            set.add(column.field);
        }
        else
        {
            for (const childColumn of column.children)
            {
                if (set.has(childColumn.field)) throw new Error("Duplicated field.");
                set.add(childColumn.field);
            }
        }
    }
}