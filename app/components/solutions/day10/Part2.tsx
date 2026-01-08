"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    solveAsync,
    RowResult,
    WorkerProgress,
    requestSkipRow,
} from "./solve2";

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
        const intensity = Math.max(0, 1 - elapsedMs / 60000);
        const red = Math.round(245 - intensity * 25);
        const green = Math.round(250 - intensity * 15);
        const blue = 255;
        return `rgb(${red}, ${green}, ${blue})`;
    } else if (elapsedMs >= 600000) {
        const intensity = Math.min(1, (elapsedMs - 600000) / 600000);
        const red = 255;
        const green = Math.round(240 - intensity * 20);
        const blue = Math.round(240 - intensity * 20);
        return `rgb(${red}, ${green}, ${blue})`;
    } else {
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

const AUTO_SKIP_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

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
    const [showWarning, setShowWarning] = useState(true);
    const [skippedRows, setSkippedRows] = useState<Set<number>>(new Set());
    const abortRef = useRef<AbortController | null>(null);

    const workerCount = getWorkerCount();

    useEffect(() => {
        if (!isRunning || startTime === null) return;

        const interval = setInterval(() => {
            setTotalElapsed(Date.now() - startTime);
        }, 100);

        return () => clearInterval(interval);
    }, [isRunning, startTime]);

    const handleSkipRow = useCallback((rowIndex: number, bestValue: number) => {
        if (bestValue === Infinity || bestValue <= 0) {
            // Can't skip without a valid best value
            return;
        }
        requestSkipRow(rowIndex, bestValue);
        setSkippedRows((prev) => new Set(prev).add(rowIndex));
    }, []);

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
        setSkippedRows(new Set());

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
                            if (
                                status === "done" ||
                                status === "error" ||
                                status === "skipped"
                            ) {
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
                abortRef.current.signal,
                AUTO_SKIP_TIMEOUT_MS
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

    const completedCount = rows.filter(
        (r) => r.status === "done" || r.status === "skipped"
    ).length;
    const processingRows = rows.filter((r) => r.status === "processing");
    const skippedCount = rows.filter((r) => r.status === "skipped").length;
    const totalRowTime = rows
        .filter(
            (r) =>
                (r.status === "done" || r.status === "skipped") && r.elapsedMs
        )
        .reduce((sum, r) => sum + (r.elapsedMs || 0), 0);
    const activeWorkers = Array.from(workerProgressMap.values()).sort(
        (a, b) => a.workerId - b.workerId
    );

    return (
        <div className="flex flex-col gap-4">
            {/* Warning Banner */}
            {showWarning && (
                <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h3 className="font-bold text-amber-800 mb-1">
                                    Computationally Intensive Solution
                                </h3>
                                <ul className="text-sm text-amber-700 space-y-1">
                                    <li>
                                        • This solution uses{" "}
                                        <strong>
                                            up to {workerCount} parallel workers
                                        </strong>{" "}
                                        and may consume significant CPU
                                        resources
                                    </li>
                                    <li>
                                        • Larger datasets can take{" "}
                                        <strong>several hours</strong> to fully
                                        process
                                    </li>
                                    <li>
                                        • Rows taking longer than{" "}
                                        <strong>30 minutes</strong> will be
                                        auto-skipped with the best found value
                                    </li>
                                    <li>
                                        • You can manually skip any row by
                                        clicking &quot;Use Best&quot; on active
                                        workers
                                    </li>
                                    <li>
                                        • Skipped rows use approximations and
                                        may not give the optimal answer
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowWarning(false)}
                            className="text-amber-600 hover:text-amber-800 p-1"
                            title="Dismiss warning"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

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
                            {skippedCount > 0 && (
                                <span className="text-amber-600 ml-2">
                                    ({skippedCount} skipped)
                                </span>
                            )}
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
                            <div className="grid gap-2">
                                {activeWorkers.map((wp) => {
                                    const canSkip =
                                        wp.best !== Infinity && wp.best > 0;
                                    const isNearTimeout =
                                        wp.elapsedMs >
                                        AUTO_SKIP_TIMEOUT_MS * 0.8;
                                    const timeRemaining =
                                        AUTO_SKIP_TIMEOUT_MS - wp.elapsedMs;

                                    return (
                                        <div
                                            key={wp.workerId}
                                            className={`rounded px-3 py-2 text-xs font-mono ${
                                                isNearTimeout
                                                    ? "bg-amber-100 border border-amber-300"
                                                    : "bg-blue-100"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="text-blue-800">
                                                    <span className="font-semibold">
                                                        W{wp.workerId + 1} → Row{" "}
                                                        {wp.rowIndex + 1}:
                                                    </span>
                                                    <span className="ml-2">
                                                        Iter:{" "}
                                                        {formatIterations(
                                                            wp.iterations
                                                        )}{" "}
                                                        | Best:{" "}
                                                        <span
                                                            className={
                                                                canSkip
                                                                    ? "text-green-700 font-bold"
                                                                    : ""
                                                            }
                                                        >
                                                            {wp.best ===
                                                            Infinity
                                                                ? "∞"
                                                                : wp.best}
                                                        </span>{" "}
                                                        | Btn: {wp.btnIdx + 1}/
                                                        {wp.numButtons} | ⏱️{" "}
                                                        {formatTime(
                                                            wp.elapsedMs
                                                        )}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        handleSkipRow(
                                                            wp.rowIndex,
                                                            wp.best
                                                        )
                                                    }
                                                    disabled={
                                                        !canSkip ||
                                                        skippedRows.has(
                                                            wp.rowIndex
                                                        )
                                                    }
                                                    className={`ml-3 px-3 py-1 rounded text-xs font-medium transition-colors ${
                                                        canSkip &&
                                                        !skippedRows.has(
                                                            wp.rowIndex
                                                        )
                                                            ? "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                    }`}
                                                    title={
                                                        !canSkip
                                                            ? "No valid solution found yet"
                                                            : skippedRows.has(
                                                                  wp.rowIndex
                                                              )
                                                            ? "Skip already requested"
                                                            : `Use ${wp.best} as the result for this row`
                                                    }
                                                >
                                                    {skippedRows.has(
                                                        wp.rowIndex
                                                    )
                                                        ? "Skipping..."
                                                        : "Use Best"}
                                                </button>
                                            </div>
                                            {isNearTimeout &&
                                                timeRemaining > 0 && (
                                                    <div className="mt-1 text-amber-700 text-xs">
                                                        ⏰ Auto-skip in{" "}
                                                        {formatTime(
                                                            timeRemaining
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}
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
                                                : row.status === "skipped"
                                                ? "rgb(254, 243, 199)" // amber-100
                                                : "transparent",
                                        borderLeft:
                                            row.status === "done"
                                                ? `4px solid ${getRowTimeBorderColor(
                                                      row.elapsedMs
                                                  )}`
                                                : row.status === "skipped"
                                                ? "4px solid rgb(245, 158, 11)" // amber-500
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
                                                : row.status === "skipped"
                                                ? "text-amber-700"
                                                : row.status === "processing"
                                                ? "text-blue-600 animate-pulse"
                                                : row.status === "error"
                                                ? "text-red-600"
                                                : "text-gray-400"
                                        }`}
                                    >
                                        {row.status === "done"
                                            ? `${row.presses} presses`
                                            : row.status === "skipped"
                                            ? `${row.presses} presses (skipped)`
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
                                        {row.status === "skipped" && "⏭️"}
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
                        {totalPresses !== null && skippedCount > 0 && (
                            <p className="text-xs text-amber-600 mt-1">
                                ⚠️ {skippedCount} row(s) were skipped - result
                                may not be optimal
                            </p>
                        )}
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
