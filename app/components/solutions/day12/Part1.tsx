"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { solveAsync, GridResult, WorkerProgress, parseInput } from "./solve1";

function formatTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = ((ms % 60000) / 1000).toFixed(0);
    return `${mins}m ${secs}s`;
}

function formatIterations(iterations: number): string {
    if (iterations >= 1000000) return `${(iterations / 1000000).toFixed(2)}M`;
    if (iterations >= 1000) return `${(iterations / 1000).toFixed(1)}K`;
    return `${iterations}`;
}

function getResultColor(canFit: boolean | undefined, status: string): string {
    if (status === "pending") return "bg-gray-100";
    if (status === "processing") return "bg-blue-100";
    if (status === "error") return "bg-red-100";
    return canFit ? "bg-green-100" : "bg-red-50";
}

function getWorkerCount(): number {
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
        return Math.min(Math.max(navigator.hardwareConcurrency - 1, 2), 8);
    }
    return 4;
}

export default function Part1() {
    const [input, setInput] = useState("");
    const [grids, setGrids] = useState<GridResult[]>([]);
    const [validCount, setValidCount] = useState<number | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [totalElapsed, setTotalElapsed] = useState<number>(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [workerProgressMap, setWorkerProgressMap] = useState<
        Map<number, WorkerProgress>
    >(new Map());
    const abortRef = useRef<AbortController | null>(null);

    const workerCount = getWorkerCount();

    useEffect(() => {
        if (!isRunning || startTime === null) return;

        const interval = setInterval(() => {
            setTotalElapsed(Date.now() - startTime);
        }, 100);

        return () => clearInterval(interval);
    }, [isRunning, startTime]);

    const handleSolve = useCallback(async () => {
        if (isRunning) {
            abortRef.current?.abort();
            setIsRunning(false);
            return;
        }

        const { gridSpecs } = parseInput(input);

        const initialGrids: GridResult[] = gridSpecs.map((spec, i) => ({
            gridIndex: i,
            canFit: false,
            status: "pending" as const,
            gridSpec: spec.display,
        }));

        setGrids(initialGrids);
        setValidCount(null);
        setWorkerProgressMap(new Map());
        setTotalElapsed(0);
        setStartTime(Date.now());
        setIsRunning(true);

        abortRef.current = new AbortController();

        try {
            const total = await solveAsync(
                input,
                (
                    gridIndex,
                    canFit,
                    status,
                    elapsedMs,
                    workerProgress,
                    gridSpec
                ) => {
                    setGrids((prev) => {
                        const updated = [...prev];
                        updated[gridIndex] = {
                            ...updated[gridIndex],
                            canFit,
                            status,
                            elapsedMs,
                            gridSpec,
                        };
                        return updated;
                    });
                    if (workerProgress) {
                        setWorkerProgressMap((prev) => {
                            const newMap = new Map(prev);
                            if (status === "done") {
                                newMap.delete(workerProgress.workerId);
                            } else {
                                newMap.set(
                                    workerProgress.workerId,
                                    workerProgress
                                );
                            }
                            return newMap;
                        });
                    }
                },
                abortRef.current.signal
            );
            setValidCount(total);
            setWorkerProgressMap(new Map());
        } catch (e) {
            if ((e as Error).message !== "Aborted") {
                console.error(e);
            }
        } finally {
            setIsRunning(false);
            setStartTime(null);
        }
    }, [input, isRunning]);

    const completedCount = grids.filter((r) => r.status === "done").length;
    const validGrids = grids.filter((r) => r.status === "done" && r.canFit);
    const invalidGrids = grids.filter((r) => r.status === "done" && !r.canFit);
    const activeWorkers = Array.from(workerProgressMap.values()).sort(
        (a, b) => a.workerId - b.workerId
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="🎅 Paste your puzzle input here..."
                    className="flex-1 border-2 border-green-300 rounded-lg p-3 bg-white text-green-900 placeholder-green-600/40 min-h-[100px] focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                    disabled={isRunning}
                />
                <button
                    onClick={handleSolve}
                    className={`px-6 py-2 ${
                        isRunning
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "bg-red-700 hover:bg-red-800"
                    } text-white rounded-lg transition-colors self-start font-medium shadow-md`}
                >
                    {isRunning ? "Stop" : "Solve"}
                </button>
            </div>

            {/* Progress indicator */}
            {grids.length > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-blue-800">
                            📊 Progress: {completedCount}/{grids.length} grids
                        </h3>
                        <div className="flex gap-4 text-sm">
                            <span className="text-green-600 font-medium">
                                ✓ {validGrids.length} valid
                            </span>
                            <span className="text-red-600 font-medium">
                                ✗ {invalidGrids.length} invalid
                            </span>
                            <span className="text-blue-600 font-medium">
                                ⏱️ {formatTime(totalElapsed)}
                            </span>
                        </div>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
                        <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{
                                width: `${
                                    (completedCount / grids.length) * 100
                                }%`,
                            }}
                        />
                    </div>

                    {/* Worker breakdown */}
                    {activeWorkers.length > 0 && (
                        <div className="mt-3 border-t border-blue-200 pt-3">
                            <div className="text-sm text-blue-700 mb-2">
                                Active Workers ({activeWorkers.length}/
                                {workerCount}):
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {activeWorkers.map((wp) => (
                                    <div
                                        key={wp.workerId}
                                        className="bg-white p-2 rounded border border-blue-200 text-xs"
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-medium text-blue-800">
                                                Worker {wp.workerId + 1}
                                            </span>
                                            <span className="text-gray-500">
                                                Grid {wp.gridIndex + 1}
                                            </span>
                                        </div>
                                        <div className="text-gray-600 mt-1 truncate">
                                            {wp.gridSpec}
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span>
                                                {formatIterations(
                                                    wp.iterations
                                                )}{" "}
                                                iterations
                                            </span>
                                            <span>
                                                {formatTime(wp.elapsedMs)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Grid results */}
            {grids.length > 0 && (
                <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                    <h3 className="font-bold mb-2 text-green-800">
                        🎁 Grid Results:
                    </h3>
                    <div className="max-h-64 overflow-y-auto border-2 border-green-300 rounded-lg bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-green-100 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-green-800">
                                        #
                                    </th>
                                    <th className="px-3 py-2 text-left text-green-800">
                                        Grid Spec
                                    </th>
                                    <th className="px-3 py-2 text-left text-green-800">
                                        Status
                                    </th>
                                    <th className="px-3 py-2 text-right text-green-800">
                                        Time
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {grids.map((grid, i) => (
                                    <tr
                                        key={i}
                                        className={`border-t border-green-200 ${getResultColor(
                                            grid.canFit,
                                            grid.status
                                        )}`}
                                    >
                                        <td className="px-3 py-2 font-mono">
                                            {i + 1}
                                        </td>
                                        <td className="px-3 py-2 text-amber-600 font-mono truncate max-w-[200px]">
                                            {grid.gridSpec || "..."}
                                        </td>
                                        <td className="px-3 py-2">
                                            {grid.status === "pending" && (
                                                <span className="text-gray-500">
                                                    ⏳ Pending
                                                </span>
                                            )}
                                            {grid.status === "processing" && (
                                                <span className="text-blue-600 animate-pulse">
                                                    🔄 Processing...
                                                </span>
                                            )}
                                            {grid.status === "done" &&
                                                grid.canFit && (
                                                    <span className="text-green-600 font-medium">
                                                        ✓ Can fit
                                                    </span>
                                                )}
                                            {grid.status === "done" &&
                                                !grid.canFit && (
                                                    <span className="text-red-600 font-medium">
                                                        ✗ Cannot fit
                                                    </span>
                                                )}
                                            {grid.status === "error" && (
                                                <span className="text-red-600">
                                                    ❌ Error
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono text-gray-600">
                                            {grid.elapsedMs !== undefined
                                                ? formatTime(grid.elapsedMs)
                                                : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Solution */}
            <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-800">⭐ Solution:</h3>
                <p className="font-mono text-lg text-yellow-900">
                    {validCount !== null
                        ? validCount
                        : isRunning
                        ? "Computing..."
                        : "—"}
                </p>
                {validCount !== null && (
                    <p className="text-sm text-yellow-700 mt-1">
                        {validCount} out of {grids.length} regions can fit all
                        their presents
                    </p>
                )}
            </div>
        </div>
    );
}
