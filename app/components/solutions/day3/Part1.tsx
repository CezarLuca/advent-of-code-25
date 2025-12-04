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

        const rows = input.trim().split("\n");
        newSteps.push(`Parsed ${rows.length} rows from input`);

        const digitArrays = rows.map((row, idx) => {
            const digits = row.split("").map((char) => parseInt(char, 10));
            newSteps.push(`Row ${idx + 1}: [${digits.join(", ")}]`);
            return digits;
        });

        const twoDigitNumbers: number[] = [];

        for (let rowIdx = 0; rowIdx < digitArrays.length; rowIdx++) {
            const digits = digitArrays[rowIdx];

            let firstMaxValue = digits[0];
            let firstMaxIndex = 0;

            for (let i = 1; i < digits.length - 1; i++) {
                if (digits[i] > firstMaxValue) {
                    firstMaxValue = digits[i];
                    firstMaxIndex = i;
                }
                if (firstMaxValue === 9) break;
            }
            newSteps.push(
                `Row ${
                    rowIdx + 1
                }: First largest digit = ${firstMaxValue} at index ${firstMaxIndex}`
            );

            let secondMaxValue = digits[firstMaxIndex + 1];
            let secondMaxIndex = firstMaxIndex + 1;

            for (let i = firstMaxIndex + 2; i < digits.length; i++) {
                if (digits[i] > secondMaxValue) {
                    secondMaxValue = digits[i];
                    secondMaxIndex = i;
                }
                if (secondMaxValue === 9) break;
            }
            newSteps.push(
                `Row ${
                    rowIdx + 1
                }: Second largest digit = ${secondMaxValue} at index ${secondMaxIndex}`
            );

            const twoDigitNum = firstMaxValue * 10 + secondMaxValue;
            twoDigitNumbers.push(twoDigitNum);
            newSteps.push(`Row ${rowIdx + 1}: Formed number = ${twoDigitNum}`);
        }

        const total = twoDigitNumbers.reduce((sum, num) => sum + num, 0);
        newSteps.push(`---`);
        newSteps.push(`Two-digit numbers: [${twoDigitNumbers.join(", ")}]`);
        newSteps.push(`Final sum: ${twoDigitNumbers.join(" + ")} = ${total}`);

        setSteps(newSteps);
        setSolution(total.toString());
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
