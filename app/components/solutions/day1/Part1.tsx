"use client";

import { useState } from "react";

export default function Part1() {
    const [input, setInput] = useState("");
    const [steps, setSteps] = useState<string[]>([]);
    const [solution, setSolution] = useState<string | null>(null);

    const solve = () => {
        // TODO: Implement Day 1 Part 1 logic
        const newSteps: string[] = [];
        newSteps.push("Parsing input...");
        setSteps(newSteps);
        setSolution("Result goes here");
    };

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
                <h3 className="font-bold mb-2">Steps:</h3>
                <ul className="list-disc pl-5 text-sm">
                    {steps.map((step, i) => (
                        <li key={i}>{step}</li>
                    ))}
                </ul>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded">
                <h3 className="font-bold">Solution:</h3>
                <p className="font-mono text-lg">{solution ?? "—"}</p>
            </div>
        </div>
    );
}
