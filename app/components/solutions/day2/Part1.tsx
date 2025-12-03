"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function Part1() {
    const [input, setInput] = useState("");
    const [steps, setSteps] = useState<string[]>([]);
    const [solution, setSolution] = useState<string | null>(null);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 });
    const containerRef = useRef<HTMLDivElement>(null);
    const ITEM_HEIGHT = 24;
    const BUFFER = 20;

    const solve = () => {
        const newSteps: string[] = [];

        const pairs = input
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p.length > 0);
        newSteps.push(
            `📝 Found ${pairs.length} number pairs: ${pairs.join(", ")}`
        );

        const validPairs = pairs.filter((pair) => {
            const [start, end] = pair.split("-").map((n) => n.trim());
            const hasLeadingZero =
                (start.length > 1 && start.startsWith("0")) ||
                (end.length > 1 && end.startsWith("0"));
            if (hasLeadingZero) {
                newSteps.push(
                    `❌ Discarding pair "${pair}" - contains leading zeros`
                );
            }
            return !hasLeadingZero;
        });
        newSteps.push(
            `✅ Valid pairs after filtering: ${validPairs.join(", ")}`
        );

        const rangeArrays: string[][] = validPairs.map((pair) => {
            const [startStr, endStr] = pair.split("-").map((n) => n.trim());
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            const range: string[] = [];
            for (let i = start; i <= end; i++) {
                range.push(String(i));
            }
            newSteps.push(`🔢 Range "${pair}" → [${range.join(", ")}]`);
            return range;
        });

        const evenCharArrays: string[][] = rangeArrays.map((arr, idx) => {
            const filtered = arr.filter((s) => s.length % 2 === 0);
            newSteps.push(
                `📏 Array ${
                    idx + 1
                }: Keeping even-length numbers → [${filtered.join(", ")}]`
            );
            return filtered;
        });

        const palindromicArrays: string[][] = evenCharArrays.map((arr, idx) => {
            const filtered = arr.filter((s) => {
                const half = s.length / 2;
                const firstHalf = s.substring(0, half);
                const secondHalf = s.substring(half);
                return firstHalf === secondHalf;
            });
            newSteps.push(
                `🔄 Array ${
                    idx + 1
                }: Keeping matching-half numbers → [${filtered.join(", ")}]`
            );
            return filtered;
        });

        const totalSum = palindromicArrays.reduce((sum, arr) => {
            return sum + arr.reduce((s, str) => s + parseInt(str, 10), 0);
        }, 0);

        newSteps.push(`🎯 Final arrays: ${JSON.stringify(palindromicArrays)}`);
        newSteps.push(`⭐ Sum of all remaining numbers: ${totalSum}`);

        setSteps(newSteps);
        setSolution(totalSum.toString());
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
