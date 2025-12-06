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

        const sections = input.trim().split(/\n\s*\n/);
        if (sections.length < 2) {
            newSteps.push(
                "❌ Invalid input: expected ranges and numbers separated by an empty line"
            );
            setSteps(newSteps);
            setSolution(null);
            return;
        }

        const rangeLines = sections[0].trim().split("\n");
        const numberLines = sections[1].trim().split("\n");

        newSteps.push(
            `📋 Found ${rangeLines.length} range(s) and ${numberLines.length} number(s)`
        );

        const ranges: Array<[number, number]> = [];
        for (const line of rangeLines) {
            const match = line.trim().match(/^(\d+)-(\d+)$/);
            if (match) {
                const start = parseInt(match[1], 10);
                const end = parseInt(match[2], 10);
                ranges.push([start, end]);
                newSteps.push(`🎯 Range parsed: ${start}-${end} (inclusive)`);
            } else {
                newSteps.push(`⚠️ Skipping invalid range line: "${line}"`);
            }
        }

        newSteps.push(`📊 Total ranges processed: ${ranges.length}`);

        const isInAnyRange = (num: number): boolean => {
            for (const [start, end] of ranges) {
                if (num >= start && num <= end) {
                    return true;
                }
            }
            return false;
        };

        const included: number[] = [];
        const excluded: number[] = [];

        for (const line of numberLines) {
            const num = parseInt(line.trim(), 10);
            if (isNaN(num)) {
                newSteps.push(`⚠️ Skipping invalid number: "${line}"`);
                continue;
            }

            if (isInAnyRange(num)) {
                included.push(num);
                const matchingRanges = ranges
                    .filter(([start, end]) => num >= start && num <= end)
                    .map(([start, end]) => `${start}-${end}`);
                newSteps.push(
                    `✅ ${num} is INCLUDED (in range${
                        matchingRanges.length > 1 ? "s" : ""
                    }: ${matchingRanges.join(", ")})`
                );
            } else {
                excluded.push(num);
                newSteps.push(`❌ ${num} is EXCLUDED (not in any range)`);
            }
        }

        newSteps.push(`📥 Included array: [${included.join(", ")}]`);
        newSteps.push(`📤 Excluded array: [${excluded.join(", ")}]`);

        const result = included.length;
        newSteps.push(`🎄 Final count of included numbers: ${result}`);

        setSteps(newSteps);
        setSolution(result.toString());
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
