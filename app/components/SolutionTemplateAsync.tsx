"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface ProgressUpdate {
    steps: string[];
    solution: string | null;
    isComplete: boolean;
    progress?: {
        memoEntries: number;
        elapsedMs: number;
        isDAG?: boolean;
    };
}

export type AsyncSolveFn = (
    input: string,
    onProgress: (update: ProgressUpdate) => void,
    signal: AbortSignal
) => void;

interface SolutionTemplateAsyncProps {
    solve: AsyncSolveFn;
}

function formatTime(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = ((ms % 60000) / 1000).toFixed(0);
    return `${mins}m ${secs}s`;
}

function formatNumber(num: number | string): string {
    const n = typeof num === "string" ? parseInt(num) : num;
    if (isNaN(n)) return num.toString();
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
}

export default function SolutionTemplateAsync({
    solve,
}: SolutionTemplateAsyncProps) {
    const [input, setInput] = useState("");
    const [steps, setSteps] = useState<string[]>([]);
    const [solution, setSolution] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState<ProgressUpdate["progress"] | null>(
        null
    );
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 });
    const containerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const ITEM_HEIGHT = 24;
    const BUFFER = 20;

    const handleSolve = useCallback(() => {
        if (isRunning) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            setIsRunning(false);
            setSteps((prev) => [...prev, "⛔ Computation cancelled by user"]);
            return;
        }

        setSteps([]);
        setSolution(null);
        setProgress(null);
        setIsRunning(true);

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const handleProgress = (update: ProgressUpdate) => {
            setSteps(update.steps);
            setSolution(update.solution);
            if (update.progress) {
                setProgress(update.progress);
            }
            if (update.isComplete) {
                setIsRunning(false);
                abortControllerRef.current = null;
            }
        };

        solve(input, handleProgress, abortController.signal);
    }, [input, isRunning, solve]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

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
                    disabled={isRunning}
                />
                <button
                    onClick={handleSolve}
                    className={`px-6 py-2 text-white rounded-lg transition-colors self-start font-medium shadow-md ${
                        isRunning
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "bg-red-700 hover:bg-red-800"
                    }`}
                >
                    {isRunning ? "Stop" : "Solve"}
                </button>
            </div>

            {/* Progress Section */}
            {progress && (
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                    <h3 className="font-bold mb-3 text-blue-800">
                        📊 Computation Info{" "}
                        {isRunning && (
                            <span className="animate-pulse">...</span>
                        )}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                            <div className="text-blue-600 font-medium">
                                Status
                            </div>
                            <div className="text-lg font-bold">
                                {isRunning ? (
                                    <span className="text-blue-600">
                                        🔄 Running
                                    </span>
                                ) : (
                                    <span className="text-green-600">
                                        ✅ Complete
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                            <div className="text-blue-600 font-medium">
                                Time Elapsed
                            </div>
                            <div className="text-lg font-bold text-blue-800">
                                {formatTime(progress.elapsedMs)}
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-200">
                            <div className="text-blue-600 font-medium">
                                Cache Entries
                            </div>
                            <div className="text-lg font-bold text-purple-600">
                                {formatNumber(progress.memoEntries)}
                            </div>
                            <div className="text-xs text-gray-500">
                                (DP memoization)
                            </div>
                        </div>
                    </div>
                    {progress.isDAG !== undefined && (
                        <div className="mt-3 text-sm">
                            <span
                                className={`inline-flex items-center px-2 py-1 rounded ${
                                    progress.isDAG
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                }`}
                            >
                                {progress.isDAG
                                    ? "✓ Graph is a DAG - efficient DP used"
                                    : "✗ Graph has cycles - slower method required"}
                            </span>
                        </div>
                    )}
                </div>
            )}

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
                    {solution ?? (isRunning ? "Computing..." : "—")}
                </p>
                {solution && (
                    <p className="text-sm text-yellow-700 mt-1">
                        Valid paths from &quot;svr&quot; to &quot;out&quot;
                        passing through both &quot;dac&quot; and &quot;fft&quot;
                    </p>
                )}
            </div>
        </div>
    );
}
