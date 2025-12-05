"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function Part2() {
    const [input, setInput] = useState("");
    const [steps, setSteps] = useState<string[]>([]);
    const [solution, setSolution] = useState<string | null>(null);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 });
    const containerRef = useRef<HTMLDivElement>(null);
    const ITEM_HEIGHT = 24;
    const BUFFER = 20;

    const solve = () => {
        const newSteps: string[] = [];

        const lines = input.trim().split("\n");
        const grid = lines.map((line) => line.split(""));
        const rows = grid.length;
        const cols = grid[0]?.length || 0;

        newSteps.push(`Parsed grid: ${rows} rows × ${cols} columns`);

        const directions = [
            [-1, -1], // top-left
            [-1, 0], // top
            [-1, 1], // top-right
            [0, -1], // left
            [0, 1], // right
            [1, -1], // bottom-left
            [1, 0], // bottom
            [1, 1], // bottom-right
        ];

        const countAtNeighbors = (row: number, col: number): number => {
            let count = 0;
            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;
                if (
                    newRow >= 0 &&
                    newRow < rows &&
                    newCol >= 0 &&
                    newCol < cols
                ) {
                    if (grid[newRow][newCol] === "@") {
                        count++;
                    }
                }
            }
            return count;
        };

        const countTotalAt = (): number => {
            return grid.flat().filter((c) => c === "@").length;
        };

        const initialCount = countTotalAt();
        newSteps.push(`Starting with ${initialCount} '@' symbols`);

        let totalReplacements = 0;
        let iteration = 0;

        while (true) {
            iteration++;

            const cellsToReplace: {
                row: number;
                col: number;
                neighbors: number;
            }[] = [];

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    if (grid[row][col] === "@") {
                        const neighborCount = countAtNeighbors(row, col);
                        if (neighborCount < 4) {
                            cellsToReplace.push({
                                row,
                                col,
                                neighbors: neighborCount,
                            });
                        }
                    }
                }
            }

            if (cellsToReplace.length === 0) {
                newSteps.push(`--- Iteration ${iteration} ---`);
                newSteps.push(`No '@' symbols with < 4 neighbors. Stopping.`);
                break;
            }

            newSteps.push(`--- Iteration ${iteration} ---`);
            newSteps.push(
                `Found ${cellsToReplace.length} '@' symbols with < 4 neighbors`
            );

            if (cellsToReplace.length <= 50) {
                for (const cell of cellsToReplace) {
                    newSteps.push(
                        `Replacing @ at (${cell.row}, ${cell.col}) with ${cell.neighbors} neighbor(s)`
                    );
                }
            } else {
                newSteps.push(
                    `(Skipping individual logs for ${cellsToReplace.length} cells)`
                );
            }

            for (const cell of cellsToReplace) {
                grid[cell.row][cell.col] = ".";
            }

            totalReplacements += cellsToReplace.length;

            const remaining = countTotalAt();
            newSteps.push(
                `Replaced ${cellsToReplace.length} symbols. Remaining '@': ${remaining}`
            );

            if (remaining === 0) {
                newSteps.push(`All '@' symbols removed.`);
                break;
            }
        }

        newSteps.push(`---`);
        newSteps.push(`Completed after ${iteration} iteration(s)`);
        newSteps.push(`Total '@' symbols replaced: ${totalReplacements}`);

        setSteps(newSteps);
        setSolution(totalReplacements.toString());
    };

    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;

        const scrollTop = containerRef.current.scrollTop;
        const containerHeight = containerRef.current.clientHeight;

        const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
        const end = Math.min(
            steps.length,
            Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER
        );

        setVisibleRange({ start, end });
    }, [steps.length]);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener("scroll", handleScroll);
            return () => container.removeEventListener("scroll", handleScroll);
        }
    }, [handleScroll]);

    const totalHeight = steps.length * ITEM_HEIGHT;
    const visibleSteps = steps.slice(visibleRange.start, visibleRange.end);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="🎅 Paste your puzzle input here..."
                    className="flex-1 border-2 border-green-300 rounded-lg p-3 bg-white text-green-900 placeholder-green-600/40 min-h-[100px] focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
                <button
                    onClick={solve}
                    className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors self-start font-medium shadow-md"
                >
                    Solve
                </button>
            </div>
            <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                <h3 className="font-bold mb-2 text-green-800">
                    ❄️ Steps ({steps.length} total):
                </h3>
                <div
                    ref={containerRef}
                    className="max-h-64 overflow-y-auto border-2 border-green-300 rounded-lg bg-white"
                >
                    <div style={{ height: totalHeight, position: "relative" }}>
                        <ul
                            className="list-disc pl-5 text-sm absolute w-full text-green-800"
                            style={{ top: visibleRange.start * ITEM_HEIGHT }}
                        >
                            {visibleSteps.map((step, i) => (
                                <li
                                    key={visibleRange.start + i}
                                    style={{ height: ITEM_HEIGHT }}
                                    className="truncate pr-2"
                                >
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-800">⭐ Solution:</h3>
                <p className="font-mono text-lg text-yellow-900">
                    {solution ?? "—"}
                </p>
            </div>
        </div>
    );
}
