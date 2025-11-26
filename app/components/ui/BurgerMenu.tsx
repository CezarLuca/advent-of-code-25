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
                    <div className="mb-4 p-2 rounded bg-blue-50 dark:bg-blue-900/30 text-sm">
                        Currently viewing: <strong>Day {openDay}</strong> - Part{" "}
                        {selectedProblems[openDay]}
                    </div>
                )}

                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {days.map((day) => (
                        <div
                            key={day}
                            className={`rounded border p-3 ${
                                openDay === day
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700"
                            }`}
                        >
                            <p className="text-sm font-medium mb-2">
                                Day {day}
                                {openDay === day && (
                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                        (open)
                                    </span>
                                )}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    className={`flex-1 rounded py-1 text-sm ${
                                        openDay === day &&
                                        selectedProblems[day] === 1
                                            ? "bg-blue-700 text-white"
                                            : "bg-blue-600 text-white hover:bg-blue-500"
                                    }`}
                                    onClick={() => handleSelect(day, 1)}
                                >
                                    Part 1
                                </button>
                                <button
                                    className={`flex-1 rounded border py-1 text-sm ${
                                        openDay === day &&
                                        selectedProblems[day] === 2
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                    }`}
                                    onClick={() => handleSelect(day, 2)}
                                >
                                    Part 2
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
