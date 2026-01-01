"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { solveAsync, RowResult } from "./solve2";

function formatTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = ((ms % 60000) / 1000).toFixed(0);
    return `${mins}m ${secs}s`;
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
    const [currentProgress, setCurrentProgress] = useState<string>("");
    const [totalElapsed, setTotalElapsed] = useState<number>(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const workerCount = getWorkerCount();

    // Update total elapsed time while running
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
        setCurrentProgress("");
        setTotalElapsed(0);
        setStartTime(Date.now());
        setIsRunning(true);

        abortRef.current = new AbortController();

        try {
            const total = await solveAsync(
                input,
                (rowIndex, presses, status, progress, elapsedMs) => {
                    setRows((prev) => {
                        const next = [...prev];
                        next[rowIndex] = {
                            rowIndex,
                            presses,
                            status,
                            progress,
                            elapsedMs,
                        };
                        return next;
                    });
                    if (progress) {
                        setCurrentProgress(progress);
                    }
                },
                abortRef.current.signal
            );
            setTotalPresses(total);
            setCurrentProgress("");
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
                                ` (${processingRows.length} rows in parallel)`}
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
                    {processingRows.length > 0 && (
                        <div className="text-xs text-blue-600 font-mono mb-1">
                            Active:{" "}
                            {processingRows
                                .map((r) => `Row ${r.rowIndex + 1}`)
                                .join(", ")}
                        </div>
                    )}
                    {currentProgress && (
                        <p className="text-sm text-blue-600 font-mono animate-pulse">
                            {currentProgress}
                        </p>
                    )}
                </div>
            )}

            {/* Row results */}
            {rows.length > 0 && (
                <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                    <h3 className="font-bold mb-2 text-green-800">
                        ❄️ Row Results:
                    </h3>
                    <div className="max-h-64 overflow-y-auto border-2 border-green-300 rounded-lg bg-white">
                        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 gap-y-1 p-3 text-sm">
                            {rows.map((row) => (
                                <div key={row.rowIndex} className="contents">
                                    <span className="text-green-600 font-mono">
                                        Row {row.rowIndex + 1}:
                                    </span>
                                    <span
                                        className={`font-mono ${
                                            row.status === "done"
                                                ? "text-green-800"
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
                                    <span className="text-gray-500 font-mono text-xs">
                                        {row.elapsedMs !== undefined &&
                                        row.status !== "pending"
                                            ? formatTime(row.elapsedMs)
                                            : ""}
                                    </span>
                                    <span>
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
