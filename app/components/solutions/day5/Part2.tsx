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

        const sections = input.trim().split(/\n\s*\n/);
        const rangeLines = sections[0].trim().split("\n");

        newSteps.push(`📋 Found ${rangeLines.length} range(s) to process`);

        const ranges: Array<[number, number]> = [];
        for (const line of rangeLines) {
            const match = line.trim().match(/^(\d+)-(\d+)$/);
            if (match) {
                const start = parseInt(match[1], 10);
                const end = parseInt(match[2], 10);
                ranges.push([start, end]);
                newSteps.push(`🎯 Range parsed: ${start}-${end}`);
            } else {
                newSteps.push(`⚠️ Skipping invalid range line: "${line}"`);
            }
        }

        if (ranges.length === 0) {
            newSteps.push("❌ No valid ranges found");
            setSteps(newSteps);
            setSolution(null);
            return;
        }

        ranges.sort((a, b) => a[0] - b[0]);
        newSteps.push(
            `📊 Sorted ranges: ${ranges
                .map(([s, e]) => `${s}-${e}`)
                .join(", ")}`
        );

        const merged: Array<[number, number]> = [];
        let current: [number, number] = [...ranges[0]];

        for (let i = 1; i < ranges.length; i++) {
            const [nextStart, nextEnd] = ranges[i];

            if (current[1] >= nextStart - 1) {
                const oldEnd = current[1];
                current[1] = Math.max(current[1], nextEnd);
                if (current[1] > oldEnd) {
                    newSteps.push(
                        `🔗 Merging ${current[0]}-${oldEnd} with ${nextStart}-${nextEnd} → ${current[0]}-${current[1]}`
                    );
                } else {
                    newSteps.push(
                        `🔗 Range ${nextStart}-${nextEnd} is contained within ${current[0]}-${current[1]}`
                    );
                }
            } else {
                merged.push(current);
                newSteps.push(
                    `✅ Finalized range: ${current[0]}-${current[1]}`
                );
                current = [nextStart, nextEnd];
            }
        }
        merged.push(current);
        newSteps.push(`✅ Finalized range: ${current[0]}-${current[1]}`);

        newSteps.push(
            `📦 Merged ranges (${merged.length} total): ${merged
                .map(([s, e]) => `${s}-${e}`)
                .join(", ")}`
        );

        let totalCount = 0;
        for (const [start, end] of merged) {
            const count = end - start + 1;
            totalCount += count;
            newSteps.push(`🔢 Range ${start}-${end} has ${count} elements`);
        }

        newSteps.push(`🎄 Total element count: ${totalCount}`);

        setSteps(newSteps);
        setSolution(totalCount.toString());
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
