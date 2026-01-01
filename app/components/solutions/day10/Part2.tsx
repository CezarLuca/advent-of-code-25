"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { solveAsync, RowResult, WorkerProgress } from "./solve2";

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

function getRowTimeColor(elapsedMs: number | undefined): string {
    if (elapsedMs === undefined) return "transparent";

    if (elapsedMs <= 60000) {
        // Light blue - more saturated for faster times
        const intensity = Math.max(0, 1 - elapsedMs / 60000);
        const red = Math.round(245 - intensity * 25); // 220-245
        const green = Math.round(250 - intensity * 15); // 235-250
        const blue = 255;
        return `rgb(${red}, ${green}, ${blue})`;
    } else if (elapsedMs >= 600000) {
        // Light red/pink - more saturated for longer times
        const intensity = Math.min(1, (elapsedMs - 600000) / 600000);
        const red = 255;
        const green = Math.round(240 - intensity * 20); // 220-240
        const blue = Math.round(240 - intensity * 20); // 220-240
        return `rgb(${red}, ${green}, ${blue})`;
    } else {
        // Gradient from light blue to white to light pink
        const progress = (elapsedMs - 60000) / (600000 - 60000);
        if (progress < 0.5) {
            const t = progress * 2;
            const red = Math.round(230 + t * 25);
            const green = Math.round(240 + t * 15);
            const blue = 255;
            return `rgb(${red}, ${green}, ${blue})`;
        } else {
            const t = (progress - 0.5) * 2;
            const red = 255;
            const green = Math.round(255 - t * 15);
            const blue = Math.round(255 - t * 15);
            return `rgb(${red}, ${green}, ${blue})`;
        }
    }
}

function getRowTimeBorderColor(elapsedMs: number | undefined): string {
    if (elapsedMs === undefined) return "transparent";

    // More saturated colors for the left border indicator
    if (elapsedMs <= 60000) {
        const intensity = Math.max(0, 1 - elapsedMs / 60000);
        const blue = Math.round(150 + intensity * 105);
        const other = Math.round(180 - intensity * 80);
        return `rgb(${other}, ${other}, ${blue})`;
    } else if (elapsedMs >= 600000) {
        const intensity = Math.min(1, (elapsedMs - 600000) / 600000);
        const red = Math.round(200 + intensity * 55);
        const other = Math.round(140 - intensity * 40);
        return `rgb(${red}, ${other}, ${other})`;
    } else {
        const progress = (elapsedMs - 60000) / (600000 - 60000);
        if (progress < 0.5) {
            const t = progress * 2;
            return `rgb(${Math.round(150 + t * 50)}, ${Math.round(
                150 + t * 30
            )}, ${Math.round(220 - t * 40)})`;
        } else {
            const t = (progress - 0.5) * 2;
            return `rgb(${Math.round(200 + t * 55)}, ${Math.round(
                180 - t * 80
            )}, ${Math.round(180 - t * 80)})`;
        }
    }
}

function getWorkerCount(): number {
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
        return Math.min(Math.max(navigator.hardwareConcurrency - 1, 2), 8);
    }
    return 4;
}

export default function Part2() {
    const [input, setInput] = useState("");
    const [rows, setRows] = useState<RowResult[]>([]);
    const [totalPresses, setTotalPresses] = useState<number | null>(null);
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

        const lines = input
            .trim()
            .split("\n")
            .filter((l) => l.trim()).length;

        const initialRows: RowResult[] = Array.from(
            { length: lines },
            (_, i) => ({
                rowIndex: i,
                presses: 0,
                status: "pending" as const,
            })
        );
        setRows(initialRows);
        setTotalPresses(null);
        setWorkerProgressMap(new Map());
        setTotalElapsed(0);
        setStartTime(Date.now());
        setIsRunning(true);

        abortRef.current = new AbortController();

        try {
            const total = await solveAsync(
                input,
                (
                    rowIndex,
                    presses,
                    status,
                    _progress,
                    elapsedMs,
                    workerProgress
                ) => {
                    setRows((prev) => {
                        const next = [...prev];
                        next[rowIndex] = {
                            rowIndex,
                            presses,
                            status,
                            elapsedMs,
                        };
                        return next;
                    });
                    if (workerProgress) {
                        setWorkerProgressMap((prev) => {
                            const next = new Map(prev);
                            if (status === "done" || status === "error") {
                                next.delete(workerProgress.workerId);
                            } else {
                                next.set(
                                    workerProgress.workerId,
                                    workerProgress
                                );
                            }
                            return next;
                        });
                    }
                },
                abortRef.current.signal
            );
            setTotalPresses(total);
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

    const completedCount = rows.filter((r) => r.status === "done").length;
    const processingRows = rows.filter((r) => r.status === "processing");
    const totalRowTime = rows
        .filter((r) => r.status === "done" && r.elapsedMs)
        .reduce((sum, r) => sum + (r.elapsedMs || 0), 0);
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
            {rows.length > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-blue-800">
                            📊 Progress: {completedCount}/{rows.length} rows
                            {processingRows.length > 0 &&
                                ` (${processingRows.length} computing)`}
                        </h3>
                        <div className="text-blue-700 font-mono text-sm flex gap-3">
                            <span>🔧 {workerCount} workers</span>
                            <span>
                                ⏱️{" "}
                                {formatTime(
                                    isRunning ? totalElapsed : totalRowTime
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
                        <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{
                                width: `${
                                    (completedCount / rows.length) * 100
                                }%`,
                            }}
                        />
                    </div>

                    {/* Worker breakdown */}
                    {activeWorkers.length > 0 && (
                        <div className="mt-3 border-t border-blue-200 pt-3">
                            <h4 className="text-xs font-semibold text-blue-700 mb-2">
                                🔧 Active Workers:
                            </h4>
                            <div className="grid gap-1">
                                {activeWorkers.map((wp) => (
                                    <div
                                        key={wp.workerId}
                                        className="bg-blue-100 rounded px-2 py-1 text-xs font-mono text-blue-800 grid grid-cols-[auto_1fr] gap-x-2"
                                    >
                                        <span className="font-semibold">
                                            W{wp.workerId + 1} → Row{" "}
                                            {wp.rowIndex + 1}:
                                        </span>
                                        <span>
                                            Iter:{" "}
                                            {formatIterations(wp.iterations)} |
                                            Best:{" "}
                                            {wp.best === Infinity
                                                ? "∞"
                                                : wp.best}{" "}
                                            | Sum: {wp.currentSum} | Btn:{" "}
                                            {wp.btnIdx + 1}/{wp.numButtons} | ⏱️{" "}
                                            {formatTime(wp.elapsedMs)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Row results */}
            {rows.length > 0 && (
                <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                    <h3 className="font-bold mb-2 text-green-800">
                        ❄️ Row Results:
                        <span className="ml-2 text-xs font-normal text-green-600">
                            (🔵 &lt;1min → ⚪ → 🔴 &gt;10min)
                        </span>
                    </h3>
                    <div className="max-h-64 overflow-y-auto border-2 border-green-300 rounded-lg bg-white">
                        <div className="flex flex-col text-sm">
                            {rows.map((row) => (
                                <div
                                    key={row.rowIndex}
                                    className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 items-center"
                                    style={{
                                        backgroundColor:
                                            row.status === "done"
                                                ? getRowTimeColor(row.elapsedMs)
                                                : "transparent",
                                        borderLeft:
                                            row.status === "done"
                                                ? `4px solid ${getRowTimeBorderColor(
                                                      row.elapsedMs
                                                  )}`
                                                : "4px solid transparent",
                                    }}
                                >
                                    <span className="text-green-700 font-mono px-2 py-1 font-medium">
                                        Row {row.rowIndex + 1}:
                                    </span>
                                    <span
                                        className={`font-mono px-2 py-1 ${
                                            row.status === "done"
                                                ? "text-gray-800"
                                                : row.status === "processing"
                                                ? "text-blue-600 animate-pulse"
                                                : row.status === "error"
                                                ? "text-red-600"
                                                : "text-gray-400"
                                        }`}
                                    >
                                        {row.status === "done"
                                            ? `${row.presses} presses`
                                            : row.status === "processing"
                                            ? "computing..."
                                            : row.status === "error"
                                            ? "no solution"
                                            : "pending"}
                                    </span>
                                    <span className="text-gray-600 font-mono text-xs px-2 py-1">
                                        {row.elapsedMs !== undefined &&
                                        row.status !== "pending"
                                            ? formatTime(row.elapsedMs)
                                            : ""}
                                    </span>
                                    <span className="px-2 py-1">
                                        {row.status === "done" && "✅"}
                                        {row.status === "processing" && "⏳"}
                                        {row.status === "error" && "❌"}
                                        {row.status === "pending" && "⏸️"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Solution */}
            <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-yellow-800">
                            ⭐ Solution:
                        </h3>
                        <p className="font-mono text-lg text-yellow-900">
                            {totalPresses !== null
                                ? totalPresses
                                : isRunning
                                ? "Computing..."
                                : "—"}
                        </p>
                    </div>
                    {totalPresses !== null && (
                        <div className="text-yellow-700 font-mono text-sm">
                            Total time: {formatTime(totalRowTime)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
