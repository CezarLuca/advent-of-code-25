"use client";

import { useCallback } from "react";
import { useDayContext, TOTAL_DAYS } from "../../context/DayContext";

interface BurgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const days = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

export default function BurgerMenu({ isOpen, onClose }: BurgerMenuProps) {
    const { openDay, selectedProblems, navigateToDay } = useDayContext();

    const handleSelect = useCallback(
        (day: number, problem: 1 | 2) => {
            navigateToDay(day, problem);
            onClose();
        },
        [navigateToDay, onClose]
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose}>
            <div
                className="absolute top-4 right-4 w-72 rounded-lg bg-white p-6 shadow-2xl dark:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="mb-4 flex items-center justify-between">
                    <span className="text-lg font-semibold">Jump to day</span>
                    <button
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                        Close
                    </button>
                </header>

                {openDay && (
                    <div className="mb-4 p-3 rounded-md border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                            Currently viewing:
                        </span>
                        <p className="font-semibold text-gray-900 dark:text-gray-50">
                            Day {openDay} — Part {selectedProblems[openDay]}
                        </p>
                    </div>
                )}

                <div
                    className="space-y-2 max-h-[70vh] overflow-y-auto pr-2
                        [&::-webkit-scrollbar]:w-1.5
                        [&::-webkit-scrollbar-track]:bg-gray-200
                        [&::-webkit-scrollbar-track]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-gray-400
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:hover:bg-gray-500
                        dark:[&::-webkit-scrollbar-track]:bg-gray-800
                        dark:[&::-webkit-scrollbar-thumb]:bg-gray-600
                        dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500"
                >
                    {days.map((day) => {
                        const isActiveDay = openDay === day;
                        const activeProblem = selectedProblems[day];

                        return (
                            <div
                                key={day}
                                className={`rounded-md border p-3 transition-colors ${
                                    isActiveDay
                                        ? "border-blue-500 bg-gray-100 dark:bg-gray-800"
                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                }`}
                            >
                                <p className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                                    Day {day}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                                            isActiveDay && activeProblem === 1
                                                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                        }`}
                                        onClick={() => handleSelect(day, 1)}
                                    >
                                        Part 1
                                    </button>
                                    <button
                                        className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                                            isActiveDay && activeProblem === 2
                                                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                                                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                                        }`}
                                        onClick={() => handleSelect(day, 2)}
                                    >
                                        Part 2
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
