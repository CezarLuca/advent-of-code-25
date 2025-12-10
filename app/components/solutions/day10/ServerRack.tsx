"use client";

import { useRef, useEffect } from "react";
import { PuzzleRowData } from "./solve1";

const MAX_LIGHTS_PER_ROW = 10;

interface ServerRackProps {
    rows: PuzzleRowData[];
    completedRows: number[][];
    currentRowIndex: number;
    currentState: number[];
    onRowClick: (index: number) => void;
    startIndex: number;
    title: string;
    isPlaying: boolean;
    horizontal?: boolean;
}

export default function ServerRack({
    rows,
    completedRows,
    currentRowIndex,
    currentState,
    onRowClick,
    startIndex,
    title,
    isPlaying,
    horizontal = false,
}: ServerRackProps) {
    const rackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentRowIndex >= 0 && rackRef.current) {
            const rowElement = rackRef.current.querySelector(
                `[data-row="${currentRowIndex}"]`
            );
            if (rowElement) {
                rowElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "center",
                });
            }
        }
    }, [currentRowIndex]);

    if (horizontal) {
        return (
            <div className="h-full flex flex-col bg-linear-to-b from-gray-900 to-gray-950 rounded-lg border-2 border-gray-700 overflow-hidden">
                <div className="bg-linear-to-r from-gray-800 to-gray-700 px-3 py-1 border-b-2 border-gray-600 flex items-center justify-between shrink-0">
                    <span className="font-mono text-gray-400 text-[10px] tracking-wider">
                        {title}
                    </span>
                    <span className="font-mono text-green-400 text-[10px]">
                        {completedRows.filter((r) => r.length > 0).length}/
                        {rows.length}
                    </span>
                </div>

                <div
                    ref={rackRef}
                    className="flex-1 overflow-x-auto overflow-y-hidden flex gap-0.5 p-1"
                    style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#374151 #111827",
                    }}
                >
                    {rows.map((row, idx) => {
                        const isCurrentRow = idx === currentRowIndex;
                        const isCompleted = completedRows[idx]?.length > 0;
                        const displayState = isCurrentRow
                            ? currentState
                            : isCompleted
                            ? completedRows[idx]
                            : [];

                        return (
                            <div
                                key={idx}
                                data-row={idx}
                                onClick={() => !isPlaying && onRowClick(idx)}
                                className={`flex flex-col items-center gap-0.5 px-0.5 py-0.5 rounded cursor-pointer transition-all shrink-0 ${
                                    isCurrentRow
                                        ? "bg-yellow-900/50 border border-yellow-500"
                                        : isCompleted
                                        ? "bg-gray-800/50"
                                        : "bg-gray-900/50"
                                }`}
                            >
                                <span className="font-mono text-gray-500 text-[7px]">
                                    {startIndex + idx + 1}
                                </span>

                                <div className="flex flex-col gap-px">
                                    {Array.from({
                                        length: MAX_LIGHTS_PER_ROW,
                                    }).map((_, lightIdx) => {
                                        const isActive =
                                            displayState[lightIdx] === 1;
                                        const isTarget =
                                            row.targetPattern[lightIdx] === 1;
                                        const exists =
                                            lightIdx < row.targetPattern.length;

                                        return (
                                            <div
                                                key={lightIdx}
                                                className={`w-1.5 h-1.5 rounded-sm ${
                                                    !exists
                                                        ? "bg-transparent"
                                                        : isActive
                                                        ? "bg-green-400 shadow-sm shadow-green-400/50"
                                                        : isTarget
                                                        ? "bg-gray-600"
                                                        : "bg-gray-800"
                                                }`}
                                            />
                                        );
                                    })}
                                </div>

                                <span className="text-[7px] h-2">
                                    {isCompleted
                                        ? "✓"
                                        : isCurrentRow
                                        ? "▶"
                                        : ""}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-linear-to-b from-gray-900 to-gray-950 rounded-lg border-2 border-gray-700 overflow-hidden">
            <div className="bg-linear-to-r from-gray-800 to-gray-700 px-3 py-2 border-b-2 border-gray-600 flex items-center justify-between shrink-0">
                <span className="font-mono text-gray-400 text-xs tracking-wider">
                    {title}
                </span>
                <span className="font-mono text-green-400 text-xs">
                    {completedRows.filter((r) => r.length > 0).length}/
                    {rows.length}
                </span>
            </div>

            <div
                ref={rackRef}
                className="flex-1 overflow-y-auto overflow-x-hidden p-1 space-y-0.5"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#374151 #111827",
                }}
            >
                {rows.map((row, idx) => {
                    const isCurrentRow = idx === currentRowIndex;
                    const isCompleted = completedRows[idx]?.length > 0;
                    const displayState = isCurrentRow
                        ? currentState
                        : isCompleted
                        ? completedRows[idx]
                        : [];

                    return (
                        <div
                            key={idx}
                            data-row={idx}
                            onClick={() => !isPlaying && onRowClick(idx)}
                            className={`flex items-center gap-1 px-1 py-0.5 rounded cursor-pointer transition-all ${
                                isCurrentRow
                                    ? "bg-yellow-900/50 border border-yellow-500"
                                    : isCompleted
                                    ? "bg-gray-800/50 hover:bg-gray-700/50"
                                    : "bg-gray-900/50 hover:bg-gray-800/50"
                            }`}
                        >
                            <span className="font-mono text-gray-500 text-[8px] w-5 text-right">
                                {startIndex + idx + 1}
                            </span>

                            <div className="flex gap-px flex-1">
                                {Array.from({ length: MAX_LIGHTS_PER_ROW }).map(
                                    (_, lightIdx) => {
                                        const isActive =
                                            displayState[lightIdx] === 1;
                                        const isTarget =
                                            row.targetPattern[lightIdx] === 1;
                                        const exists =
                                            lightIdx < row.targetPattern.length;

                                        return (
                                            <div
                                                key={lightIdx}
                                                className={`w-2 h-2 rounded-sm transition-all ${
                                                    !exists
                                                        ? "bg-transparent"
                                                        : isActive
                                                        ? "bg-green-400 shadow-sm shadow-green-400/50"
                                                        : isTarget
                                                        ? "bg-gray-600"
                                                        : "bg-gray-800"
                                                }`}
                                            />
                                        );
                                    }
                                )}
                            </div>

                            <span className="text-[8px] w-3">
                                {isCompleted ? "✓" : isCurrentRow ? "▶" : ""}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="bg-gray-800 px-2 py-1 border-t border-gray-700 shrink-0">
                <div className="flex justify-between text-[8px] font-mono text-gray-500">
                    <span>ROWS: {rows.length}</span>
                    <span>
                        DONE:{" "}
                        <span className="text-green-400">
                            {completedRows.filter((r) => r.length > 0).length}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    );
}
