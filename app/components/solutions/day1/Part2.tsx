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

        const arrayLength = 100;
        newSteps.push("Created array with numbers 0-99");

        let currentIndex = 50;
        newSteps.push("Initialized currentIndex to 50");

        let timesIndexZero = 0;
        newSteps.push("Initialized timesIndexZero counter to 0");

        const instructions = input.trim().split("\n");
        newSteps.push(`Parsed ${instructions.length} instructions`);

        for (const instruction of instructions) {
            if (!instruction.trim()) continue;

            const direction = instruction.charAt(0).toUpperCase();
            const indexMovement = parseInt(instruction.slice(1), 10);

            if (isNaN(indexMovement)) {
                newSteps.push(`Skipping invalid instruction: ${instruction}`);
                continue;
            }

            const previousIndex = currentIndex;

            if (direction === "R") {
                currentIndex = (currentIndex + indexMovement) % arrayLength;

                let timesCrossed = Math.floor(
                    (previousIndex + indexMovement) / arrayLength
                );

                if (currentIndex === 0 && timesCrossed > 0) {
                    timesCrossed--;
                }

                if (timesCrossed > 0) {
                    timesIndexZero += timesCrossed;
                    newSteps.push(
                        `Passed over index 0 ${timesCrossed} time(s)! Count: ${timesIndexZero}`
                    );
                }
            } else if (direction === "L") {
                currentIndex =
                    (((currentIndex - indexMovement) % arrayLength) +
                        arrayLength) %
                    arrayLength;

                let timesCrossed = 0;

                if (previousIndex === 0) {
                    timesCrossed = Math.floor(
                        (indexMovement - 1) / arrayLength
                    );
                } else {
                    const virtualPosition = previousIndex - indexMovement;

                    if (virtualPosition < 0) {
                        const stepsAfterFirstZero =
                            indexMovement - previousIndex;
                        timesCrossed =
                            1 +
                            Math.floor((stepsAfterFirstZero - 1) / arrayLength);
                    }
                }

                if (timesCrossed > 0) {
                    timesIndexZero += timesCrossed;
                    newSteps.push(
                        `Passed over index 0 ${timesCrossed} time(s)! Count: ${timesIndexZero}`
                    );
                }
            }

            newSteps.push(
                `${direction}${indexMovement} -> currentIndex is now ${currentIndex}`
            );

            if (currentIndex === 0) {
                timesIndexZero++;
                newSteps.push(`Landed on index 0! Count: ${timesIndexZero}`);
            }
        }

        newSteps.push(`Final count of times on index 0: ${timesIndexZero}`);

        setSteps(newSteps);
        setVisibleRange({ start: 0, end: 100 });
        setSolution(timesIndexZero.toString());
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
