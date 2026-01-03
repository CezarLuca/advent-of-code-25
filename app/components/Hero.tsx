"use client";

import { useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Gift,
    Sparkles,
} from "lucide-react";

export default function Hero() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <section className="relative overflow-hidden rounded-2xl border-2 border-green-300 bg-linear-to-br from-red-50 via-white to-green-50 p-6 shadow-lg dark:border-green-800 dark:from-red-950/30 dark:via-slate-900 dark:to-green-950/30">
            {/* Decorative elements */}
            <div className="absolute -right-4 -top-4 text-6xl opacity-20">
                🎄
            </div>
            <div className="absolute -bottom-2 -left-2 text-4xl opacity-20">
                ❄️
            </div>

            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
                <Gift className="h-8 w-8 text-red-600 dark:text-red-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 md:text-3xl">
                    Welcome to the AoC 2025 Solver!
                </h1>
                <Sparkles className="h-6 w-6 text-yellow-500" />
            </div>

            {/* Brief intro - always visible */}
            <p className="mb-4 text-gray-700 dark:text-gray-300">
                Get hints, verify your solutions, and explore how to approach{" "}
                <a
                    href="https://adventofcode.com/2025"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-green-700 underline decoration-dotted hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
                >
                    Advent of Code 2025
                    <ExternalLink className="h-4 w-4" />
                </a>{" "}
                puzzles.
            </p>

            {/* Expandable content */}
            <div
                className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                }`}
            >
                <div className="overflow-hidden">
                    <div className="space-y-4 pt-2">
                        {/* What is AoC */}
                        <div className="rounded-lg bg-white/60 p-4 dark:bg-slate-800/60">
                            <h2 className="mb-2 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-50">
                                🎅 What is Advent of Code?
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Advent of Code is an annual programming
                                challenge created by{" "}
                                <a
                                    href="https://was.tl/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-semibold text-green-700 underline decoration-dotted hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
                                >
                                    Eric Wastl
                                    <ExternalLink className="h-4 w-4" />
                                </a>{" "}
                                . Each December, multiple coding puzzles are
                                released daily, ranging from beginner-friendly
                                to advanced. It&apos;s a fantastic way to
                                improve your problem-solving skills and have fun
                                with code!
                            </p>
                        </div>

                        {/* How to use */}
                        <div className="rounded-lg bg-white/60 p-4 dark:bg-slate-800/60">
                            <h2 className="mb-2 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-50">
                                🛠️ How to Use This App
                            </h2>
                            <ul className="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                <li>
                                    Click on any day below to expand its
                                    solutions
                                </li>
                                <li>Toggle between Problem 1 and Problem 2</li>
                                <li>
                                    Paste your puzzle input to verify your
                                    answers
                                </li>
                                <li>
                                    View step-by-step solution explanations for
                                    hints
                                </li>
                                <li>
                                    Compare your approach with the provided
                                    solutions
                                </li>
                            </ul>
                        </div>

                        {/* Disclaimer */}
                        <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-4 dark:border-amber-700 dark:bg-amber-950/30">
                            <h2 className="mb-2 flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                                ⚠️ Disclaimer
                            </h2>
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                This web app is{" "}
                                <strong>not affiliated with</strong> Advent of
                                Code or Eric Wastl. It is an open-source project
                                created to demonstrate my personal solutions and
                                provide a learning resource for fellow
                                programmers. Please support the official{" "}
                                <a
                                    href="https://adventofcode.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold underline hover:text-amber-600 dark:hover:text-amber-200"
                                >
                                    Advent of Code
                                </a>{" "}
                                website!
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toggle button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
            >
                {isExpanded ? (
                    <>
                        Show Less <ChevronUp className="h-4 w-4" />
                    </>
                ) : (
                    <>
                        Learn More <ChevronDown className="h-4 w-4" />
                    </>
                )}
            </button>
        </section>
    );
}
