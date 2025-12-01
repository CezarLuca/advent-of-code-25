"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export default function Part1() {
    const [input, setInput] = useState("");
    const [steps, setSteps] = useState<string[]>([]);
    const [solution, setSolution] = useState<string | null>(null);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 });
    const containerRef = useRef<HTMLDivElement>(null);
    const ITEM_HEIGHT = 24; // approximate height of each step item
    const BUFFER = 20; // extra items to render above/below viewport

    const solve = () => {
        const newSteps: string[] = [];

        const numberArray = Array.from({ length: 100 }, (_, i) => i);
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

            if (direction === "R") {
                currentIndex =
                    (currentIndex + indexMovement) % numberArray.length;
            } else if (direction === "L") {
                currentIndex =
                    (currentIndex -
                        (indexMovement % numberArray.length) +
                        numberArray.length) %
                    numberArray.length;
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
                    placeholder="Paste your puzzle input here"
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 min-h-[100px]"
                />
                <button
                    onClick={solve}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors self-start"
                >
                    Solve
                </button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
                <h3 className="font-bold mb-2">
                    Steps ({steps.length} total):
                </h3>
                <div
                    ref={containerRef}
                    className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded"
                >
                    <div style={{ height: totalHeight, position: "relative" }}>
                        <ul
                            className="list-disc pl-5 text-sm absolute w-full"
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
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded">
                <h3 className="font-bold">Solution:</h3>
                <p className="font-mono text-lg">{solution ?? "—"}</p>
            </div>
        </div>
    );
}
